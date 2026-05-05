const mongoose = require('mongoose');
const crypto = require('crypto');

const LikesSchema = new mongoose.Schema({
    likeId: {
        type: String,
        default: () => crypto.randomUUID(),
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

LikesSchema.index({ visitorId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('Likes', LikesSchema);
