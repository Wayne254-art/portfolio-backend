const mongoose = require("mongoose");
const crypto = require("crypto");

const MessageSchema = new mongoose.Schema(
    {
        messageId: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        contact: {
            type: String,
            trim: true,
            maxlength: 40,
            default: "",
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        status: {
            type: String,
            enum: ["new", "read", "archived"],
            default: "new",
            index: true,
        },
        sourceIp: {
            type: String,
            default: "",
        },
        userAgent: {
            type: String,
            default: "",
            maxlength: 300,
        },
    },
    { timestamps: true }
);

MessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
