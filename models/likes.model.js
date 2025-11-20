const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const LikesSchema = new mongoose.Schema({
    likeId: {
        type: String,
        default: uuidv4,
        unique: true,
    },
    visitorId: {
        type: String,
        required: true,
    },
    projectId: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Likes', LikesSchema);
