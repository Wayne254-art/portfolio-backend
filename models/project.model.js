const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ProjectSchema = new mongoose.Schema(
    {
        projectId: {
            type: String,
            default: uuidv4,
            unique: true,
        },

        title: {
            type: String,
            required: true,
        },

        description: {
            type: String,
            required: true,
        },

        technologies: {
            type: String,
            required: true,
        },

        image: {
            type: String,
            required: true,
        },

        detailImage: {
            type: String,
            required: true,
        },

        videoLink: {
            type: String,
            default: null,
        },

        liveSite: {
            type: String,
            required: true,
        },

        descriptions: {
            type: Array, // JSON → Array
            required: true,
        },

        likes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
