
// routes/admin.routes.js
const express = require('express');
const mailControllers = require('../controllers/mail.controller');

const router = express.Router();

router.post('/send-email', mailControllers.send_mail)

module.exports = router;