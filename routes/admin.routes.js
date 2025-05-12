
// routes/admin.routes.js
const express = require('express');
const adminControllers = require('../controllers/admin.controller');

const router = express.Router();

router.post('/admin-login', adminControllers.admin_login);

module.exports = router;
