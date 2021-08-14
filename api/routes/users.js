const express = require('express');
const router = express.Router();
const checkAuthentication = require('../middleware/checkAuthentication');
const checkIsAdmin = require('../middleware/checkIsAdmin');
const UserController = require('../controllers/users');
const AdminUserController = require('../controllers/admin_users');

router.post('/signup', UserController.users_signup);
router.post('/login', UserController.users_login);
router.post('/activate/resend', UserController.users_resend_activation);
router.get('/activate/:code', UserController.users_activate);
router.post('/password/forget', UserController.users_password_forget);
router.post('/password/reset/:token', UserController.users_password_reset);
router.post('/profile/update', checkAuthentication, UserController.users_profile_update);
router.post('/profile/upload', checkAuthentication, UserController.users_profile_upload_pic);

// Admin routes
router.get('', checkAuthentication, checkIsAdmin, AdminUserController.admin_get_users)
router.post('/create', checkAuthentication, checkIsAdmin, AdminUserController.admin_create_user)
router.patch('/:userID/update', checkAuthentication, checkIsAdmin, AdminUserController.admin_update_user)

module.exports = router;