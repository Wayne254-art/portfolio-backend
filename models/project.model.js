const { DataTypes } = require("sequelize");
const sequelize = require('../config/db');

const Project = sequelize.define("Project", {
    projectId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    technologies: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    detailImage: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    videoLink: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    liveSite: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descriptions: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'projects',
    timestamps: true,
});

module.exports = Project;
