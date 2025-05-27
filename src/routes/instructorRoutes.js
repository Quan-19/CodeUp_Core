const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const mongoose = require('mongoose');
const instructorController = require('../controllers/instructorController');

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


//thống kê khóa học của instructor
router.get('/courses/:id/statistics', authenticate, requireRole('instructor'), async (req, res) => {
  const { id: courseId } = req.params;
  try {
    const course = await Course.findById(courseId).populate('instructor', 'username email');
    if (!course) {
      return res.status(404).json({ message: 'Khóa học không tồn tại' });
    }
    const enrollments = await Enrollment.find({ course: courseId }).populate('student', 'username email');
    const statistics = {
      course,
      totalEnrollments: enrollments.length,
      students: enrollments.map(enrollment => ({
        studentId: enrollment.student._id,
        username: enrollment.student.username,
        email: enrollment.student.email,
        enrolledAt: enrollment.enrolledAt
      }))
    };
    res.json(statistics);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});


const checkInstructor = async (req, res, next) => {
  try {
    const { userId } = req.params; // Hoặc req.query.userId tùy cách bạn gửi
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    if (user.role !== 'instructor') {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
    }
    
    req.user = user; // Lưu user vào request để sử dụng ở các middleware sau
    next();
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

// Lấy danh sách khóa học bằng user ID (không yêu cầu token)
router.get('/courses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kiểm tra xem user có phải là instructor không
    const user = await User.findById(userId);
    if (!user || user.role !== 'instructor') {
      return res.status(403).json({ message: 'Chỉ instructor mới có quyền truy cập' });
    }
    
    const courses = await Course.find({ instructor: userId });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});


// Lấy danh sách học viên đã mua khóa học của instructor (không yêu cầu token)
router.get('/students/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Kiểm tra instructor
    const instructor = await User.findById(userId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(403).json({ message: 'Chỉ instructor mới có quyền truy cập' });
    }

    const students = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $match: {
          'course.instructor': userId // Đã sửa ở đây
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student._id',
          username: { $first: '$student.username' },
          email: { $first: '$student.email' },
          enrolledCourses: {
            $push: {
              courseId: '$course._id',
              courseTitle: '$course.title',
              enrolledAt: '$enrolledAt'
            }
          }
        }
      }
    ]);

    res.json(students);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách học viên:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
module.exports = router;