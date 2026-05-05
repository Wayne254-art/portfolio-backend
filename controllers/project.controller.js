const Project = require("../models/project.model");
const Likes = require("../models/likes.model");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const {
    cleanMultiline,
    cleanString,
    extractArrayField,
    isSafeUrl,
} = require("../utils/sanitize");

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
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete file:", err.message);
        }
    });
};

const deleteOldFile = (fileUrl) => deleteFile(safeUploadPath(fileUrl));

const uploadedFileUrl = (req, file) =>
    file ? `${req.protocol}://${req.get("host")}/uploads/${file.filename}` : null;

const normalizeProjectPayload = (body, isUpdate = false) => {
    const payload = {
        title: cleanString(body.title, 120),
        description: cleanMultiline(body.description, 700),
        technologies: cleanString(body.technologies, 300),
        videoLink: cleanString(body.videoLink, 500),
        liveSite: cleanString(body.liveSite, 500),
        descriptions: extractArrayField(body, "descriptions")
            .map((item) => cleanMultiline(item, 600))
            .filter(Boolean)
            .slice(0, 12),
    };

    const errors = [];
    const requiredFields = ["title", "description", "technologies", "liveSite"];

    for (const field of requiredFields) {
        if (!isUpdate && !payload[field]) errors.push(`${field} is required`);
    }

    if (payload.title && payload.title.length < 3) errors.push("title is too short");
    if (payload.description && payload.description.length < 20) errors.push("description is too short");
    if (payload.liveSite && !isSafeUrl(payload.liveSite, true)) errors.push("liveSite must be a valid http(s) URL");
    if (payload.videoLink && !isSafeUrl(payload.videoLink, false)) errors.push("videoLink must be a valid http(s) URL");
    if (!isUpdate && payload.descriptions.length === 0) errors.push("at least one project detail is required");

    return { payload, errors };
};

class ProjectControllers {
    create_project = async (req, res) => {
        const { projectId } = req.params;
        const isUpdate = Boolean(projectId);
        const profileFile = req.files?.image?.[0];
        const detailFile = req.files?.detailImage?.[0];
        const { payload, errors } = normalizeProjectPayload(req.body, isUpdate);

        if (!isUpdate && (!profileFile || !detailFile)) {
            errors.push("thumbnail and detail images are required");
        }

        if (errors.length > 0) {
            deleteFile(profileFile?.path);
            deleteFile(detailFile?.path);
            return res.status(400).json({ message: "Invalid project data", errors });
        }

        try {
            const uploadedImage = uploadedFileUrl(req, profileFile);
            const uploadedDetailImage = uploadedFileUrl(req, detailFile);

            if (isUpdate) {
                const project = await Project.findOne({ projectId });
                if (!project) {
                    deleteFile(profileFile?.path);
                    deleteFile(detailFile?.path);
                    return res.status(404).json({ message: "Project not found." });
                }

                if (uploadedImage && project.image) deleteOldFile(project.image);
                if (uploadedDetailImage && project.detailImage) deleteOldFile(project.detailImage);

                for (const [key, value] of Object.entries(payload)) {
                    if (Array.isArray(value)) {
                        if (value.length > 0) project[key] = value;
                    } else if (value) {
                        project[key] = value;
                    }
                }

                project.image = uploadedImage || project.image;
                project.detailImage = uploadedDetailImage || project.detailImage;

                await project.save();
                return res.status(200).json(project);
            }

            const newProject = await Project.create({
                projectId: crypto.randomUUID(),
                ...payload,
                image: uploadedImage,
                detailImage: uploadedDetailImage,
                likes: 0,
            });

            return res.status(201).json(newProject);
        } catch (error) {
            deleteFile(profileFile?.path);
            deleteFile(detailFile?.path);
            console.error("Project save error:", error.message);
            return res.status(500).json({ message: "Unable to save project" });
        }
    };

    get_projects = async (req, res) => {
        try {
            const projects = await Project.find({}).sort({ createdAt: -1 }).lean();
            return res.status(200).json({ projects, count: projects.length });
        } catch (error) {
            console.error("Project fetch error:", error.message);
            return res.status(500).json({ message: "Unable to fetch projects" });
        }
    };

    get_project_by_projectId = async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findOne({ projectId }).lean();
            if (!project) return res.status(404).json({ message: "Project not found." });
            return res.status(200).json(project);
        } catch (error) {
            console.error("Project detail error:", error.message);
            return res.status(500).json({ message: "Unable to fetch project" });
        }
    };

    delete_project = async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findOneAndDelete({ projectId });
            if (!project) return res.status(404).json({ message: "Project not found." });

            if (project.image) deleteOldFile(project.image);
            if (project.detailImage) deleteOldFile(project.detailImage);
            await Likes.deleteMany({ projectId });

            return res.status(200).json({ message: "Project deleted successfully." });
        } catch (error) {
            console.error("Project delete error:", error.message);
            return res.status(500).json({ message: "Unable to delete project" });
        }
    };

    toggle_project_like = async (req, res) => {
        const visitorId = cleanString(req.body.visitorId, 80);
        const projectId = cleanString(req.body.projectId, 80);

        if (!visitorId || !projectId || !uuidPattern.test(projectId)) {
            return res.status(400).json({ message: "Missing or invalid like data" });
        }

        try {
            const project = await Project.findOne({ projectId });
            if (!project) return res.status(404).json({ message: "Project not found" });

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

            console.error("Like toggle error:", error.message);
            return res.status(500).json({ message: "Unable to update like" });
        }
    };
}

module.exports = new ProjectControllers();
