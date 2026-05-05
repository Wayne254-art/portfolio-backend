const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const interiorProjectController = require("../controllers/interiorProject.controller");
const { requireAdmin } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${crypto.randomUUID()}${extension}`);
    },
});

const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)) return cb(null, true);
    return cb(new Error("Only JPEG, PNG, and WEBP images are allowed."));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 9,
    },
});

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    keyPrefix: "interior-write",
});

const likeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: "interior-like",
});

const uploadFields = upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 8 },
]);

router.post("/create-interior-project", requireAdmin, writeLimiter, uploadFields, interiorProjectController.create_project);
router.put("/create-interior-project/:interiorProjectId", requireAdmin, writeLimiter, uploadFields, interiorProjectController.create_project);
router.get("/get-all-interior-projects", interiorProjectController.get_projects);
router.get("/interior-project-details/:interiorProjectId", interiorProjectController.get_project_by_id);
router.delete("/delete-interior-project/:interiorProjectId", requireAdmin, writeLimiter, interiorProjectController.delete_project);
router.post("/toggle-interior-like", likeLimiter, interiorProjectController.toggle_like);

module.exports = router;
