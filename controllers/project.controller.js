const Project = require("../models/project.model"); // Mongoose Project model
const Likes = require("../models/likes.model");     // Mongoose Likes model
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const deleteOldFile = (fileUrl) => {
    if (!fileUrl) return;
    const filePath = path.join(__dirname, "..", "uploads", path.basename(fileUrl));
    fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete old file:", err.message);
    });
};

class ProjectControllers {

    // Create or update project
    create_project = async (req, res) => {
        try {
            const { title, description, technologies, videoLink, liveSite, descriptions } = req.body;
            const { projectId } = req.params;

            const profileFile = req.files?.image?.[0];
            const detailFile = req.files?.detailImage?.[0];

            const uploadedImage = profileFile
                ? `${req.protocol}://${req.get("host")}/uploads/${profileFile.filename}`
                : null;

            const uploadedDetailImage = detailFile
                ? `${req.protocol}://${req.get("host")}/uploads/${detailFile.filename}`
                : null;

            if (projectId) {
                // Update existing project
                const project = await Project.findOne({ projectId });
                if (!project) return res.status(404).json({ message: "Project not found." });

                if (uploadedImage && project.image) deleteOldFile(project.image);
                if (uploadedDetailImage && project.detailImage) deleteOldFile(project.detailImage);

                project.title = title || project.title;
                project.description = description || project.description;
                project.technologies = technologies || project.technologies;
                project.videoLink = videoLink || project.videoLink;
                project.liveSite = liveSite || project.liveSite;
                project.descriptions = descriptions || project.descriptions;
                project.image = uploadedImage || project.image;
                project.detailImage = uploadedDetailImage || project.detailImage;

                await project.save();
                return res.status(200).json(project);
            } else {
                // Create new project
                if (!title || !description || !technologies || !liveSite || !descriptions) {
                    return res.status(400).json({ message: "Missing required fields." });
                }

                const newProject = new Project({
                    projectId: uuidv4(),
                    title,
                    description,
                    technologies,
                    videoLink,
                    liveSite,
                    descriptions,
                    image: uploadedImage,
                    detailImage: uploadedDetailImage,
                    likes: 0,
                });

                await newProject.save();
                return res.status(201).json(newProject);
            }
        } catch (error) {
            console.error("Error creating/updating project:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    };

    // Get all projects
    get_projects = async (req, res) => {
        try {
            const projects = await Project.find({}).lean();
            return res.status(200).json({ projects, count: projects.length });
        } catch (error) {
            console.error("Error fetching projects:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    };

    // Get a single project by projectId
    get_project_by_projectId = async (req, res) => {
        const { projectId } = req.params;
        try {
            const project = await Project.findOne({ projectId }).lean();
            if (!project) return res.status(404).json({ message: "Project not found." });
            return res.status(200).json(project);
        } catch (error) {
            console.error("Error fetching project by ID:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    };

    // Delete a project
    delete_project = async (req, res) => {
        const { projectId } = req.params;
        try {
            const project = await Project.findOneAndDelete({ projectId });
            if (!project) return res.status(404).json({ message: "Project not found." });

            // Delete uploaded files
            if (project.image) deleteOldFile(project.image);
            if (project.detailImage) deleteOldFile(project.detailImage);

            return res.status(200).json({ message: "Project deleted successfully." });
        } catch (error) {
            console.error("Error deleting project:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    };

    // Toggle project like
    toggle_project_like = async (req, res) => {
        const { visitorId, projectId } = req.body;
        if (!visitorId || !projectId) return res.status(400).json({ message: "Missing credentials" });

        try {
            const existingLike = await Likes.findOne({ visitorId, projectId });
            let liked = false;

            if (existingLike) {
                // Unlike
                await Likes.findOneAndDelete({ visitorId, projectId });
                await Project.findOneAndUpdate({ projectId }, { $inc: { likes: -1 } });
                liked = false;
            } else {
                // Like
                await Likes.create({ visitorId, projectId });
                await Project.findOneAndUpdate({ projectId }, { $inc: { likes: 1 } });
                liked = true;
            }

            return res.status(200).json({ liked, message: liked ? "Project liked" : "Project unliked" });
        } catch (error) {
            console.error("Like toggle error:", error);
            return res.status(500).json({ message: "Server error while toggling like", error: error.message });
        }
    };

}

module.exports = new ProjectControllers();
