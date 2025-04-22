// backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); // Kiểm tra xem model có đúng không
const CourseDetail = require('../models/CourseDetail.js'); 

// Route để lấy tất cả khóa học
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();  // Lấy tất cả khóa học
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }
    res.json(courses);  // Trả về dữ liệu khóa học
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Route để lấy chi tiết khóa học theo ID
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }
    const detail = await CourseDetail.findOne({ courseId: course._id });

    res.json({
      ...course.toObject(),
      details: detail || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;