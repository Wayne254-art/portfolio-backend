const mongoose = require("mongoose");
const crypto = require("crypto");

const InteriorProjectSchema = new mongoose.Schema(
    {
        interiorProjectId: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 700,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "",
        },
        category: {
            type: String,
            trim: true,
            maxlength: 80,
            default: "Interior Design",
        },
        coverImage: {
            type: String,
            required: true,
            maxlength: 500,
        },
        images: {
            type: [String],
            required: true,
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0 && items.length <= 8,
                message: "Interior project gallery must include 1 to 8 images.",
            },
        },
        highlights: {
            type: [String],
            default: [],
            validate: {
                validator: (items) => Array.isArray(items) && items.length <= 10,
                message: "Interior project highlights must include 10 items or fewer.",
            },
        },
        likes: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

InteriorProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model("InteriorProject", InteriorProjectSchema);
