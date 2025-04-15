const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

// Middleware xác thực và kiểm tra role
router.use(authenticate, requireRole('instructor'));

router.post('/courses', instructorController.createCourse);
router.put('/courses/:courseId/content', instructorController.addCourseContent);
router.get('/stats', instructorController.getInstructorStats);

module.exports = router;