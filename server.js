const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cookieParser());

const corsOptions = {
    origin: ["http://localhost:5173", "https://wayne-marwa.web.app"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const adminRoutes = require('./routes/admin.routes')
const projectRoutes = require('./routes/project.routes')
const mailRoutes = require('./routes/mail.routes')

app.use('/api', adminRoutes)
app.use('/api', projectRoutes)
app.use('/api', mailRoutes)

sequelize
    .authenticate()
    .then(() => {
        console.log("Database connected successfully.");
        return sequelize.sync();
    })
    .then(() => {
        console.log("Models synchronized with the database.");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
