const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema(
    {
        adminId: { type: String, required: true },   // Link to MySQL adminId
        email: { type: String },                     // Optional but useful
        action: { type: String, required: true },    // "Login" | "Failed Login" | etc.
    },
    { timestamps: true } // adds createdAt + updatedAt automatically
);

// Optional: index for faster queries
AdminLogSchema.index({ adminId: 1, action: 1 });

const AdminLog = mongoose.model("AdminLog", AdminLogSchema);

module.exports = AdminLog;
