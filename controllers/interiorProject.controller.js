const InteriorProject = require("../models/interiorProject.model");
const Likes = require("../models/likes.model");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { cleanMultiline, cleanString, extractArrayField } = require("../utils/sanitize");

const uploadsRoot = path.resolve(__dirname, "..", "uploads");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const safeUploadPath = (fileUrl) => {
    if (!fileUrl) return null;
    const resolved = path.resolve(uploadsRoot, path.basename(fileUrl));
    return resolved.startsWith(`${uploadsRoot}${path.sep}`) ? resolved : null;
};

const deleteFile = (filePath) => {
    if (!filePath) return;
    fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") console.error("Failed to delete file:", err.message);
    });
};

const deleteOldFile = (fileUrl) => deleteFile(safeUploadPath(fileUrl));
const fileUrl = (req, file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

const normalizePayload = (body, isUpdate = false) => {
    const payload = {
        title: cleanString(body.title, 120),
        description: cleanMultiline(body.description, 700),
        location: cleanString(body.location, 120),
        category: cleanString(body.category, 80) || "Interior Design",
        highlights: extractArrayField(body, "highlights")
            .map((item) => cleanMultiline(item, 400))
            .filter(Boolean)
            .slice(0, 10),
    };

    const errors = [];
    if (!isUpdate && !payload.title) errors.push("title is required");
    if (!isUpdate && !payload.description) errors.push("description is required");
    if (payload.title && payload.title.length < 3) errors.push("title is too short");
    if (payload.description && payload.description.length < 20) errors.push("description is too short");

    return { payload, errors };
};

class InteriorProjectController {
    create_project = async (req, res) => {
        const { interiorProjectId } = req.params;
        const isUpdate = Boolean(interiorProjectId);
        const coverFile = req.files?.coverImage?.[0];
        const galleryFiles = req.files?.images || [];
        const { payload, errors } = normalizePayload(req.body, isUpdate);

        if (!isUpdate && !coverFile) errors.push("cover image is required");
        if (!isUpdate && galleryFiles.length === 0) errors.push("at least one gallery image is required");

        if (errors.length > 0) {
            deleteFile(coverFile?.path);
            galleryFiles.forEach((file) => deleteFile(file.path));
            return res.status(400).json({ message: "Invalid interior project data", errors });
        }

        try {
            const coverImage = coverFile ? fileUrl(req, coverFile) : null;
            const images = galleryFiles.map((file) => fileUrl(req, file));

            if (isUpdate) {
                const project = await InteriorProject.findOne({ interiorProjectId });
                if (!project) {
                    deleteFile(coverFile?.path);
                    galleryFiles.forEach((file) => deleteFile(file.path));
                    return res.status(404).json({ message: "Interior project not found" });
                }

                if (coverImage && project.coverImage) deleteOldFile(project.coverImage);
                if (images.length > 0) project.images.forEach(deleteOldFile);

                for (const [key, value] of Object.entries(payload)) {
                    if (Array.isArray(value)) {
                        project[key] = value;
                    } else if (value) {
                        project[key] = value;
                    }
                }

                project.coverImage = coverImage || project.coverImage;
                project.images = images.length > 0 ? images : project.images;

                await project.save();
                return res.status(200).json(project);
            }

            const newProject = await InteriorProject.create({
                interiorProjectId: crypto.randomUUID(),
                ...payload,
                coverImage,
                images,
                likes: 0,
            });

            return res.status(201).json(newProject);
        } catch (error) {
            deleteFile(coverFile?.path);
            galleryFiles.forEach((file) => deleteFile(file.path));
            console.error("Interior project save error:", error.message);
            return res.status(500).json({ message: "Unable to save interior project" });
        }
    };

    get_projects = async (req, res) => {
        try {
            const projects = await InteriorProject.find({}).sort({ createdAt: -1 }).lean();
            return res.status(200).json({ projects, count: projects.length });
        } catch (error) {
            console.error("Interior project fetch error:", error.message);
            return res.status(500).json({ message: "Unable to fetch interior projects" });
        }
    };

    get_project_by_id = async (req, res) => {
        try {
            const project = await InteriorProject.findOne({ interiorProjectId: req.params.interiorProjectId }).lean();
            if (!project) return res.status(404).json({ message: "Interior project not found" });
            return res.status(200).json(project);
        } catch (error) {
            console.error("Interior project detail error:", error.message);
            return res.status(500).json({ message: "Unable to fetch interior project" });
        }
    };

    delete_project = async (req, res) => {
        try {
            const project = await InteriorProject.findOneAndDelete({ interiorProjectId: req.params.interiorProjectId });
            if (!project) return res.status(404).json({ message: "Interior project not found" });

            if (project.coverImage) deleteOldFile(project.coverImage);
            project.images.forEach(deleteOldFile);
            await Likes.deleteMany({ projectId: req.params.interiorProjectId });

            return res.status(200).json({ message: "Interior project deleted successfully" });
        } catch (error) {
            console.error("Interior project delete error:", error.message);
            return res.status(500).json({ message: "Unable to delete interior project" });
        }
    };

    toggle_like = async (req, res) => {
        const visitorId = cleanString(req.body.visitorId, 80);
        const projectId = cleanString(req.body.projectId, 80);

        if (!visitorId || !projectId || !uuidPattern.test(projectId)) {
            return res.status(400).json({ message: "Missing or invalid like data" });
        }

        try {
            const project = await InteriorProject.findOne({ interiorProjectId: projectId });
            if (!project) return res.status(404).json({ message: "Interior project not found" });

            const existingLike = await Likes.findOne({ visitorId, projectId });
            let liked = false;

            if (existingLike) {
                await Likes.deleteOne({ _id: existingLike._id });
                project.likes = Math.max(0, (project.likes || 0) - 1);
            } else {
                await Likes.create({ visitorId, projectId });
                project.likes = (project.likes || 0) + 1;
                liked = true;
            }

            await project.save();
            return res.status(200).json({ liked, likes: project.likes });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(200).json({ liked: true, message: "Already liked" });
            }

            console.error("Interior like error:", error.message);
            return res.status(500).json({ message: "Unable to update like" });
        }
    };
}

module.exports = new InteriorProjectController();
