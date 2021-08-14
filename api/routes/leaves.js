const express = require('express');
const router = express.Router();
const checkAuthentication = require('../middleware/checkAuthentication');
const checkIsAdmin = require('../middleware/checkIsAdmin');
const LeaveController = require('../controllers/leaves');

router.get('', checkAuthentication, LeaveController.get_leaves);
router.post('/create', checkAuthentication, LeaveController.create_leave);
router.patch('/:leaveID/update', checkAuthentication, LeaveController.update_leave);
router.get('/all', checkAuthentication, checkIsAdmin, LeaveController.admin_get_leaves);
router.patch('/:leaveID/review', checkAuthentication, checkIsAdmin, LeaveController.admin_review_leave);

module.exports = router;