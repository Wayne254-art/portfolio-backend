const express = require("express");
const cors = require("cors");
const connectMongo = require("./config/mongodb");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

const defaultOrigins = [
    "https://wayne-marwa.web.app",
    "http://localhost:5173",
    "http://192.168.56.1:5173",
    "http://192.168.1.133:5173",
];

const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    if (!req.path.startsWith("/uploads")) {
        res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    } else {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    }

    next();
});

app.use(cookieParser());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

app.use(express.json({ limit: "25kb" }));
app.use(express.urlencoded({ extended: true, limit: "25kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    fallthrough: false,
    maxAge: "7d",
}));

const adminRoutes = require("./routes/admin.routes");
const projectRoutes = require("./routes/project.routes");
const interiorProjectRoutes = require("./routes/interiorProject.routes");
const mailRoutes = require("./routes/mail.routes");

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api", adminRoutes);
app.use("/api", projectRoutes);
app.use("/api", interiorProjectRoutes);
app.use("/api", mailRoutes);

connectMongo();

app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ error: "Origin is not allowed" });
    }

    if (err.name === "MulterError") {
        return res.status(400).json({ error: err.message });
    }

    if (err.message?.includes("Only JPEG")) {
        return res.status(400).json({ error: err.message });
    }

    console.error("Server error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
