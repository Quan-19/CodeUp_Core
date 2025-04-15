const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Lấy tất cả khóa học
router.get('/home', courseController.getAllCourses);

// Lấy khóa học nổi bật (cho trang home)
// router.get('/featured', courseController.getFeaturedCourses);

// Tạo khóa học mới (admin)
router.post('/', courseController.createCourse);

module.exports = router;