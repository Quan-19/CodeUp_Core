const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { authenticate } = require('../middlewares/auth');
const userController = require('../controllers/userController');

router.get('/courses', authenticate, async (req, res) => {
    const { search } = req.query;
    try {
      const courses = await Course.find({
        title: { $regex: search || '', $options: 'i' } // Tìm kiếm theo tiêu đề
      });
      res.json(courses);
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
  });

router.get('/courses/:id', authenticate, async (req, res) => {
  const { id: courseId } = req.params;
  try {
    const enrollment = await Enrollment.findOne({ course: courseId, student: req.user.id });
    if (!enrollment) {
      return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
    }
    const course = await Course.findById(courseId).populate('content');
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

router.post('/enrollments', authenticate, async (req, res) => {
  const { courseId } = req.body;
  try {
    const enrollment = new Enrollment({ student: req.user.id, course: courseId });
    await enrollment.save();
    res.status(201).json({ message: 'Đăng ký khóa học thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
// Lấy danh sách người dùng
router.get('/', userController.getAllUsers);

// Lấy người dùng theo ID
router.get('/:id', userController.getUserById);

// Xoá người dùng
router.delete('/:userId', userController.deleteUser);

// Cập nhật người dùng
router.put('/:userId', userController.updateUser);

module.exports = router;