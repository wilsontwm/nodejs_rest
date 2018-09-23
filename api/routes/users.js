const express = require('express');
const router = express.Router();
const checkAuthentication = require('../middleware/checkAuthentication');
const UserController = require('../controllers/users');

router.post('/signup', UserController.users_signup);
router.post('/login', UserController.users_login);
router.post('/activate/resend', UserController.users_resend_activation);
router.get('/activate/:code', UserController.users_activate);
router.post('/password/forget', UserController.users_password_forget);
router.post('/password/reset/:token', UserController.users_password_reset);
router.post('/profile/update', checkAuthentication, UserController.users_profile_update);

module.exports = router;