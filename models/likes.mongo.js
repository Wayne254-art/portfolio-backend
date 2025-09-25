const mongoose = require("mongoose");

const LikesSchema = new mongoose.Schema(
    {
        likeId: {
            type: String,
            required: true,
            unique: true,
            default: () => new mongoose.Types.UUID().toString(), // generates UUID v4
        },
        visitorId: {
            type: String,
            required: true,
        },
        projectId: {
            type: String,
            required: true,
        },
    },
    { timestamps: true } // ✅ adds createdAt & updatedAt
);

// Indexes for faster lookups (optional but recommended)
LikesSchema.index({ visitorId: 1 });
LikesSchema.index({ projectId: 1 });
LikesSchema.index({ visitorId: 1, projectId: 1 }, { unique: true });
// prevents duplicate likes from the same visitor on the same project

const Likes = mongoose.model("Likes", LikesSchema);

module.exports = Likes;
