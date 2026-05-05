const express = require("express");
const router = express.Router();
const projectControllers = require("../controllers/project.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { requireAdmin } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");

const uploadDir = path.join(__dirname, "../uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${crypto.randomUUID()}${extension}`);
    },
});

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const isAllowed = allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension);

    if (isAllowed) return cb(null, true);
    return cb(new Error("Only JPEG, PNG, and WEBP images are allowed."));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2,
    },
});

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    keyPrefix: "project-write",
});

const likeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: "project-like",
});

const uploadFields = upload.fields([{ name: "image", maxCount: 1 }, { name: "detailImage", maxCount: 1 }]);

router.post("/create-project", requireAdmin, writeLimiter, uploadFields, projectControllers.create_project);
router.put("/create-project/:projectId", requireAdmin, writeLimiter, uploadFields, projectControllers.create_project);
router.get("/get-all-projects", projectControllers.get_projects);
router.get("/project-details/:projectId", projectControllers.get_project_by_projectId);
router.get("/projects/:projectId", projectControllers.get_project_by_projectId);
router.delete("/delete-project/:projectId", requireAdmin, writeLimiter, projectControllers.delete_project);
router.post("/toggle-like", likeLimiter, projectControllers.toggle_project_like);

module.exports = router;
