const Likes = require("../models/likes.model");
const Project = require("../models/project.model");
const path = require("path");
const fs = require("fs");

const deleteOldFile = (fileUrl) => {
    const filePath = path.join(__dirname, "..", "uploads", path.basename(fileUrl));
    fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete old file:", err.message);
    });
};

class projectControllers {

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
                // === Update Logic ===
                const project = await Project.findByPk(projectId);
                if (!project) {
                    return res.status(404).json({ message: "Project not found." });
                }

                // Delete old images if new ones are uploaded
                if (uploadedImage && project.image) deleteOldFile(project.image);
                if (uploadedDetailImage && project.detailImage) deleteOldFile(project.detailImage);

                const updated = await project.update({
                    title: title || project.title,
                    description: description || project.description,
                    technologies: technologies || project.technologies,
                    videoLink: videoLink || project.videoLink,
                    liveSite: liveSite || project.liveSite,
                    descriptions: descriptions || project.descriptions,
                    image: uploadedImage || project.image,
                    detailImage: uploadedDetailImage || project.detailImage,
                });

                return res.status(200).json(updated);
            } else {
                // === Creation Logic ===
                if (!title || !description || !technologies || !liveSite || !descriptions) {
                    return res.status(400).json({ message: "Missing required fields." });
                }

                const newProject = await Project.create({
                    title,
                    description,
                    technologies,
                    image: uploadedImage,
                    detailImage: uploadedDetailImage,
                    videoLink,
                    liveSite,
                    descriptions,
                });

                return res.status(201).json(newProject);
            }
        } catch (error) {
            console.error("Error creating/updating project:", error);
            res.status(500).json({ message: "Server error", error });
        }
    }

    get_projects = async (req, res) => {
        try {
            const projects = await Project.findAll();
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ message: "Server error", error });
        }
    }

    get_project_by_projectId = async (req, res) => {
        try {
            const project = await Project.findByPk(req.params.projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found." });
            }
            res.status(200).json(project);
        } catch (error) {
            res.status(500).json({ message: "Server error", error });
        }
    }

    delete_project = async (req, res) => {
        try {
            const project = await Project.destroy({ where: { projectId: req.params.projectId } });
            if (!project) {
                return res.status(404).json({ message: "Project not found." });
            }
            res.status(200).json({ message: "Project deleted successfully." });
        } catch (error) {
            res.status(500).json({ message: "Server error", error });
        }

    }

    toggle_project_like = async (req, res) => {
        const { visitorId, projectId } = req.body;

        if (!visitorId || !projectId) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        try {
            const existingLike = await Likes.findOne({
                where: { visitorId, projectId },
            });

            if (existingLike) {
                await existingLike.destroy();
                await Project.increment({ likes: -1 }, { where: { projectId } });
                return res.status(200).json({ liked: false, message: 'Project unliked' });
            } else {
                await Likes.create({ visitorId, projectId });
                await Project.increment({ likes: 1 }, { where: { projectId } });
                return res.status(201).json({ liked: true, message: 'Project liked' });
            }
        } catch (error) {
            console.error('Like toggle error:', error);
            res.status(500).json({ message: 'Server error while toggling like' });
        }
    }
}
module.exports = new projectControllers();
