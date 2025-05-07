const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');

// Chỉ cho phép người dạy tạo khóa học

router.put('/courses/:id/content', authenticate, requireRole('instructor'), async (req, res) => {
  const { id: courseId } = req.params;
  try {
    const course = await Course.findOne({ _id: courseId, instructor: req.user.id });
    if (!course) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa khóa học này' });
    }
    course.content = course.content || [];
    course.content.push(req.body);
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

router.get('/stats', authenticate, requireRole('instructor'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id });
    const enrollments = await Enrollment.find({ course: { $in: courses.map(c => c._id) } });

    const stats = {
      totalCourses: courses.length,
      totalStudents: enrollments.length,
      earnings: courses.reduce((sum, course) => sum + course.price, 0),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
module.exports = router;