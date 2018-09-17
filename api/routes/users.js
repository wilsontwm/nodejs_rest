const express = require('express');
const router = express.Router();
const UserController = require('../controllers/users');

router.post('/signup', UserController.users_signup);
router.post('/login', UserController.users_login);
router.post('/activate/resend', UserController.users_resend_activation);

module.exports = router;