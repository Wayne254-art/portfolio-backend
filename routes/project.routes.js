const express = require("express");
const router = express.Router();
const projectControllers = require("../controllers/project.controller");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer storage
const uploadDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Check if directory exists; if not, create it
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// File filter to allow only images (JPEG, PNG, JPG)
const fileFilter = (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files (JPEG, PNG, JPG) are allowed."));
    }
};

// Initialize multer with file filter and size limits (optional 5MB limit)
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB file size limit
});

router.post("/create-project", upload.fields([{ name: "image" }, { name: "detailImage" }]), projectControllers.create_project);
router.put("/create-project/:projectId", upload.fields([{ name: "image" }, { name: "detailImage" }]), projectControllers.create_project);
router.get("/get-all-projects", projectControllers.get_projects);
router.get("/project-details/:projectId", projectControllers.get_project_by_projectId);
router.delete("/delete-project/:projectId", projectControllers.delete_project);
router.post('/toggle-like', projectControllers.toggle_project_like);

module.exports = router;
