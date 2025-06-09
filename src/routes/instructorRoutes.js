const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
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

// Lấy danh sách học viên đã mua khóa học của instructor (không yêu cầu token)
router.get('/students/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm các khóa học do instructor tạo
    const courses = await Course.find({ instructor: userId }).select('_id title');
    const courseIds = courses.map(c => c._id);

    // Tìm các thanh toán thành công liên quan đến các khóa học đó
    const payments = await Payment.find({ 
      course: { $in: courseIds }, 
      status: 'success' 
    }).populate('user', 'username email').populate('course', 'title');

    // Gom học viên và các khóa học họ đã mua
    const studentMap = new Map();
    payments.forEach(p => {
      if (!studentMap.has(p.user._id.toString())) {
        studentMap.set(p.user._id.toString(), {
          _id: p.user._id,
          username: p.user.username,
          email: p.user.email,
          enrolledCourses: []
        });
      }
      studentMap.get(p.user._id.toString()).enrolledCourses.push({
        courseTitle: p.course.title,
        enrolledAt: p.createdAt
      });
    });

    const students = Array.from(studentMap.values());
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách học viên', error: err.message });
  }
});
router.get('/revenue/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const courses = await Course.find({ instructor: userId }).select('_id title price');
    const courseIds = courses.map(c => c._id);

    const payments = await Payment.find({ 
      course: { $in: courseIds }, 
      status: 'success' 
    });

    const revenueMap = {};

    payments.forEach(p => {
      const courseId = p.course.toString();
      if (!revenueMap[courseId]) {
        const course = courses.find(c => c._id.toString() === courseId);
        revenueMap[courseId] = {
          courseTitle: course.title,
          totalRevenue: 0
        };
      }
      revenueMap[courseId].totalRevenue += p.amount;
    });

    const revenueData = Object.values(revenueMap);
    res.json(revenueData);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy doanh thu', error: err.message });
  }
});
router.get('/revenue/monthly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const courses = await Course.find({ instructor: userId }).select('_id title');
    const courseMap = Object.fromEntries(courses.map(c => [c._id.toString(), c.title]));

    const payments = await Payment.find({
      course: { $in: Object.keys(courseMap) },
      status: 'success'
    });

    const monthlyRevenue = {};

    payments.forEach(p => {
      const courseId = p.course.toString();
      const courseTitle = courseMap[courseId];
      const month = new Date(p.createdAt).toISOString().slice(0, 7); // "YYYY-MM"

      if (!monthlyRevenue[month]) monthlyRevenue[month] = {};
      if (!monthlyRevenue[month][courseTitle]) monthlyRevenue[month][courseTitle] = 0;

      monthlyRevenue[month][courseTitle] += p.amount;
    });

    const data = Object.entries(monthlyRevenue).map(([month, courses]) => {
      const row = { month };
      for (const [courseTitle, revenue] of Object.entries(courses)) {
        row[courseTitle] = revenue;
      }
      return row;
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thống kê doanh thu theo tháng', error: err.message });
  }
});

module.exports = router;