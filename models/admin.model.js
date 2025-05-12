const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('admin', {
    adminId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin',
    },
}, {
    tableName: 'admin',
    timestamps: true,
    hooks: {
        beforeCreate: async (admin) => {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(admin.password, salt);
        },
    },
});

module.exports = Admin;