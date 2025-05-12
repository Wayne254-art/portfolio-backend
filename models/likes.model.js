const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Likes = sequelize.define('Likes', {
    likeId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    visitorId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    projectId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'likes',
    timestamps: true,
});

module.exports = Likes;