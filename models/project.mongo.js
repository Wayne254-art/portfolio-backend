// models/project.mongo.js
const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
    {
        projectId: {
            type: String, // UUID stored as string
            required: true,
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
            type: String, // Could be an array of strings if needed
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
        },
        liveSite: {
            type: String,
            required: true,
        },
        descriptions: {
            type: Object, // JSON in Sequelize → Object in Mongo
            required: true,
        },
        likes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true } // same as Sequelize timestamps
);

module.exports = mongoose.model("Project", ProjectSchema);
