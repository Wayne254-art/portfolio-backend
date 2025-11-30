const express = require("express");
const cors = require("cors");
const connectMongo = require("./config/mongodb"); // MongoDB only
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cookieParser());

const corsOptions = {
    origin: ["https://wayne-marwa.web.app", "http://localhost:5173", "http://192.168.1.104:5173"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const adminRoutes = require("./routes/admin.routes");
const projectRoutes = require("./routes/project.routes");
const mailRoutes = require("./routes/mail.routes");

app.use("/api", adminRoutes);
app.use("/api", projectRoutes);
app.use("/api", mailRoutes);

// Connect MongoDB ONLY
connectMongo();

// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
