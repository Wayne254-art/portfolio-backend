const LikesSQL = require("../models/likes.model");
const LikesMongo = require("../models/likes.mongo"); // Mongoose (MongoDB)
const ProjectSQL = require("../models/project.model"); // Sequelize model
const ProjectMongo = require("../models/project.mongo"); // Mongoose model
const { v4: uuidv4 } = require("uuid");
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
                const projectSQL = await ProjectSQL.findByPk(projectId);
                const projectMongo = await ProjectMongo.findOne({ projectId });

                if (!projectSQL || !projectMongo) {
                    return res.status(404).json({ message: "Project not found." });
                }

                // Delete old images if new ones are uploaded
                if (uploadedImage && projectSQL.image) deleteOldFile(projectSQL.image);
                if (uploadedDetailImage && projectSQL.detailImage) deleteOldFile(projectSQL.detailImage);

                // Update in SQL
                const updatedSQL = await projectSQL.update({
                    title: title || projectSQL.title,
                    description: description || projectSQL.description,
                    technologies: technologies || projectSQL.technologies,
                    videoLink: videoLink || projectSQL.videoLink,
                    liveSite: liveSite || projectSQL.liveSite,
                    descriptions: descriptions || projectSQL.descriptions,
                    image: uploadedImage || projectSQL.image,
                    detailImage: uploadedDetailImage || projectSQL.detailImage,
                });

                // Update in Mongo
                await ProjectMongo.updateOne(
                    { projectId },
                    {
                        $set: {
                            title: title || projectMongo.title,
                            description: description || projectMongo.description,
                            technologies: technologies || projectMongo.technologies,
                            videoLink: videoLink || projectMongo.videoLink,
                            liveSite: liveSite || projectMongo.liveSite,
                            descriptions: descriptions || projectMongo.descriptions,
                            image: uploadedImage || projectMongo.image,
                            detailImage: uploadedDetailImage || projectMongo.detailImage,
                        },
                    }
                );

                return res.status(200).json(updatedSQL);
            } else {
                // === Creation Logic ===
                if (!title || !description || !technologies || !liveSite || !descriptions) {
                    return res.status(400).json({ message: "Missing required fields." });
                }

                const newId = uuidv4();

                // Create in SQL
                const newProjectSQL = await ProjectSQL.create({
                    projectId: newId,
                    title,
                    description,
                    technologies,
                    image: uploadedImage,
                    detailImage: uploadedDetailImage,
                    videoLink,
                    liveSite,
                    descriptions,
                });

                // Create in Mongo
                const newProjectMongo = new ProjectMongo({
                    projectId: newId,
                    title,
                    description,
                    technologies,
                    image: uploadedImage,
                    detailImage: uploadedDetailImage,
                    videoLink,
                    liveSite,
                    descriptions,
                });
                await newProjectMongo.save();

                return res.status(201).json(newProjectSQL);
            }
        } catch (error) {
            console.error("Error creating/updating project:", error);
            res.status(500).json({ message: "Server error", error });
        }
    }

    get_projects = async (req, res) => {
        try {
            let projects;

            // Try MySQL first
            try {
                projects = await ProjectSQL.findAll();
                if (projects && projects.length > 0) {
                    return res.status(200).json({
                        source: "mysql",
                        projects,
                        count: projects.length
                    });
                }
            } catch (mysqlError) {
                console.warn("MySQL failed, falling back to MongoDB:", mysqlError.message);
            }

            // Fallback to Mongo
            try {
                projects = await ProjectMongo.find({}).lean();
                if (projects && projects.length > 0) {
                    return res.status(200).json({
                        source: "mongo",
                        projects,
                        count: projects.length
                    });
                }
            } catch (mongoError) {
                console.warn("MongoDB failed:", mongoError.message);
            }

            // If both failed
            return res.status(500).json({
                message: "Unable to fetch projects from both MySQL and MongoDB."
            });

        } catch (error) {
            console.error("Error fetching projects:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    }

    get_project_by_projectId = async (req, res) => {
        const { projectId } = req.params;

        try {
            let project;

            // Try MySQL first
            try {
                project = await ProjectSQL.findByPk(projectId);
                if (project) {
                    return res.status(200).json({
                        source: "mysql",
                        project
                    });
                }
            } catch (mysqlError) {
                console.warn("MySQL lookup failed, falling back to MongoDB:", mysqlError.message);
            }

            // Try MongoDB fallback
            try {
                project = await ProjectMongo.findOne({ projectId }).lean();
                if (project) {
                    return res.status(200).json({
                        source: "mongo",
                        project
                    });
                }
            } catch (mongoError) {
                console.warn("MongoDB lookup failed:", mongoError.message);
            }

            // If neither found
            return res.status(404).json({ message: "Project not found in either DB." });

        } catch (error) {
            console.error("Error fetching project by ID:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    }

    delete_project = async (req, res) => {
        const { projectId } = req.params;

        try {
            let deleted = false;

            // Try MySQL first
            try {
                const sqlDelete = await ProjectSQL.destroy({ where: { projectId } });
                if (sqlDelete) {
                    deleted = true;
                    return res.status(200).json({
                        source: "mysql",
                        message: "Project deleted successfully."
                    });
                }
            } catch (mysqlError) {
                console.warn("MySQL delete failed, falling back to MongoDB:", mysqlError.message);
            }

            // Try MongoDB fallback
            try {
                const mongoDelete = await ProjectMongo.findOneAndDelete({ projectId });
                if (mongoDelete) {
                    deleted = true;
                    return res.status(200).json({
                        source: "mongo",
                        message: "Project deleted successfully."
                    });
                }
            } catch (mongoError) {
                console.warn("MongoDB delete failed:", mongoError.message);
            }

            // If not found in either DB
            if (!deleted) {
                return res.status(404).json({ message: "Project not found in either DB." });
            }

        } catch (error) {
            console.error("Error deleting project:", error);
            return res.status(500).json({ message: "Server error", error });
        }
    }

    toggle_project_like = async (req, res) => {
        const { visitorId, projectId } = req.body;

        if (!visitorId || !projectId) {
            return res.status(400).json({ message: "Missing credentials" });
        }

        try {
            let likeToggled = false;
            let liked = false;

            // ✅ First try MySQL
            try {
                const existingLike = await LikesSQL.findOne({
                    where: { visitorId, projectId },
                });

                if (existingLike) {
                    // 🔹 Remove from MySQL
                    await existingLike.destroy();

                    // 🔹 Update project likes count (MySQL)
                    await ProjectSQL.increment({ likes: -1 }, { where: { projectId } });

                    // 🔹 Also remove from Mongo
                    await LikesMongo.findOneAndDelete({ visitorId, projectId });

                    liked = false;
                    likeToggled = true;
                } else {
                    // 🔹 Add to MySQL
                    await LikesSQL.create({ visitorId, projectId });

                    // 🔹 Update project likes count (MySQL)
                    await ProjectSQL.increment({ likes: 1 }, { where: { projectId } });

                    // 🔹 Also add to Mongo
                    await LikesMongo.create({ visitorId, projectId });

                    liked = true;
                    likeToggled = true;
                }
            } catch (mysqlError) {
                console.warn("⚠️ MySQL unavailable, falling back to MongoDB:", mysqlError.message);

                // ✅ If MySQL fails, use Mongo only
                const existingLike = await LikesMongo.findOne({ visitorId, projectId });

                if (existingLike) {
                    await LikesMongo.findOneAndDelete({ visitorId, projectId });
                    liked = false;
                    likeToggled = true;
                } else {
                    await LikesMongo.create({ visitorId, projectId });
                    liked = true;
                    likeToggled = true;
                }
            }

            if (!likeToggled) {
                return res.status(500).json({ message: "Could not toggle like in any database" });
            }

            return res.status(200).json({
                liked,
                message: liked ? "Project liked" : "Project unliked",
            });

        } catch (error) {
            console.error("❌ Like toggle error:", error);
            res.status(500).json({
                message: "Server error while toggling like",
                error: error.message,
            });
        }
    };


}
module.exports = new projectControllers();
