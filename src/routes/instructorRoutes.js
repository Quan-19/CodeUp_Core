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
const CourseDetail = require('~/models/CourseDetail');
const Favorite = require('~/models/Favorite');
const ratings = require('~/models/Rating');
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

// Lấy danh sách học viên đã mua khóa học của instructor (có phân trang và lọc)
router.get('/students/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Tìm các khóa học do instructor tạo
    const courses = await Course.find({ instructor: userId }).select('_id title');
    const courseIds = courses.map(c => c._id);

    // Tìm các thanh toán thành công liên quan đến các khóa học đó
    const paymentsQuery = {
      course: { $in: courseIds },
      status: 'success'
    };

    // Tìm kiếm học viên nếu có
    if (search) {
      const keywords = search.trim().split(/\s+/); // Tách từ khóa theo dấu cách
      const searchConditions = keywords.map(keyword => ({
        $or: [
          { username: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } }
        ]
      }));

      const users = await User.find({
        $and: searchConditions
      }).select('_id');

      paymentsQuery.user = { $in: users.map(u => u._id) };
    }

    // Lấy danh sách các thanh toán phù hợp
    const payments = await Payment.find(paymentsQuery)
      .populate('user', 'username email avatar')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Đếm tổng số học viên duy nhất
    const allPayments = await Payment.find(paymentsQuery).select('user');
    const uniqueStudentIds = new Set(allPayments.map(p => p.user.toString()));
    const totalStudents = uniqueStudentIds.size;

    // Gom học viên và các khóa học họ đã mua
    const studentMap = new Map();
    payments.forEach(p => {
      const userIdStr = p.user._id.toString();
      if (!studentMap.has(userIdStr)) {
        studentMap.set(userIdStr, {
          _id: p.user._id,
          username: p.user.username,
          email: p.user.email,
          avatar: p.user.avatar,
          enrolledCourses: []
        });
      }
      studentMap.get(userIdStr).enrolledCourses.push({
        courseId: p.course._id,
        courseTitle: p.course.title,
        enrolledAt: p.createdAt
      });
    });

    const students = Array.from(studentMap.values());

    res.json({
      students,
      total: totalStudents,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalStudents / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách học viên', error: err.message });
  }
});

// Thống kê doanh thu theo khóa học (có phân trang và lọc)
router.get('/revenue/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;

    // Tìm kiếm khóa học nếu có
    const courseQuery = { instructor: userId };
    if (search) {
      courseQuery.title = { $regex: search, $options: 'i' };
    }

    const courses = await Course.find(courseQuery)
      .select('_id title price thumbnail')
      .skip((page - 1) * limit)
      .limit(limit);

    const courseIds = courses.map(c => c._id);
    const totalCourses = await Course.countDocuments(courseQuery);

    // Tính doanh thu cho từng khóa học
    const revenueData = await Payment.aggregate([
      { 
        $match: { 
          course: { $in: courseIds },
          status: 'success' 
        }
      },
      {
        $group: {
          _id: '$course',
          totalRevenue: { $sum: '$amount' },
          totalStudents: { $sum: 1 },
          lastPayment: { $max: '$createdAt' }
        }
      }
    ]);

    const result = courses.map(course => {
      const revenueInfo = revenueData.find(r => r._id.toString() === course._id.toString()) || {
        totalRevenue: 0,
        totalStudents: 0,
        lastPayment: null
      };
      
      return {
        courseId: course._id,
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        price: course.price,
        totalRevenue: revenueInfo.totalRevenue,
        totalStudents: revenueInfo.totalStudents,
        lastPayment: revenueInfo.lastPayment
      };
    });

    res.json({
      revenueData: result,
      total: totalCourses,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCourses / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy doanh thu', error: err.message });
  }
});

// Thống kê doanh thu theo tháng (cải tiến với nhiều thông tin hơn)
router.get('/revenue/monthly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const courses = await Course.find({ instructor: userId }).select('_id title');
    const courseIds = courses.map(c => c._id);

    // Lấy dữ liệu 12 tháng gần nhất
    const monthlyData = await Payment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: 'success',
          createdAt: { 
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          totalEnrollments: { $sum: 1 },
          topCourses: {
            $push: {
              course: '$course',
              amount: '$amount'
            }
          }
        }
      },
      {
        $addFields: {
          monthName: {
            $let: {
              vars: {
                monthsInVietnamese: [
                  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", 
                  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
                  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                ]
              },
              in: {
                $arrayElemAt: [
                  "$$monthsInVietnamese",
                  { $subtract: ["$_id.month", 1] }
                ]
              }
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Xử lý thêm thông tin về khóa học nổi bật
    const courseMap = new Map(courses.map(c => [c._id.toString(), c.title]));
    const processedData = await Promise.all(monthlyData.map(async month => {
      // Tìm khóa học có doanh thu cao nhất
      const courseRevenue = {};
      month.topCourses.forEach(item => {
        const courseId = item.course.toString();
        courseRevenue[courseId] = (courseRevenue[courseId] || 0) + item.amount;
      });

      let topCourseId = null;
      let topCourseRevenue = 0;
      Object.entries(courseRevenue).forEach(([courseId, revenue]) => {
        if (revenue > topCourseRevenue) {
          topCourseId = courseId;
          topCourseRevenue = revenue;
        }
      });

      return {
        month: `${month._id.month}/${month._id.year}`,
        monthName: month.monthName,
        totalRevenue: month.totalRevenue,
        totalEnrollments: month.totalEnrollments,
        topCourse: topCourseId ? {
          courseId: topCourseId,
          courseTitle: courseMap.get(topCourseId),
          revenue: topCourseRevenue,
          percentage: Math.round((topCourseRevenue / month.totalRevenue) * 100)
        } : null
      };
    }));

    res.json(processedData);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi thống kê doanh thu theo tháng', error: err.message });
  }
});

// Thống kê tổng quan cho instructor
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Thống kê tổng quan
    const courses = await Course.find({ instructor: userId });
    const courseIds = courses.map(c => c._id);
    
    const [totalStudents, totalRevenue, monthlyTrend] = await Promise.all([
      // Tổng học viên
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      // Tổng doanh thu
      Payment.aggregate([
        { 
          $match: { 
            course: { $in: courseIds },
            status: 'success'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      
      // Xu hướng theo tháng (12 tháng gần nhất)
      Payment.aggregate([
        {
          $match: {
            course: { $in: courseIds },
            status: 'success',
            createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      totalCourses: courses.length,
      totalStudents,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyTrend: monthlyTrend.map(item => ({
        month: `${item._id.month}/${item._id.year}`,
        revenue: item.total,
        enrollments: item.count
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy thống kê', error: err.message });
  }
});

// Lấy danh sách học viên đã mua khóa học của instructor theo khóa học (có phân trang)
router.get('/courses/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Kiểm tra khóa học có tồn tại không
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Khóa học không tồn tại' });
    }

    // Lấy danh sách thanh toán cho khóa học này
    const payments = await Payment.find({ 
      course: courseId,
      status: 'success'
    })
    .populate('user', 'username email avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    const totalStudents = await Payment.countDocuments({ 
      course: courseId,
      status: 'success'
    });

    const students = payments.map(payment => ({
      _id: payment.user._id,
      username: payment.user.username,
      email: payment.user.email,
      avatar: payment.user.avatar,
      purchasedAt: payment.createdAt,
      amount: payment.amount
    }));

    res.json({
      students,
      total: totalStudents,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalStudents / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách học viên', error: err.message });
  }
});
// Route xóa khóa học chỉ sử dụng userId (không dùng token)
router.delete('/courses/:userId/:courseId', async (req, res) => {
  const { userId, courseId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Kiểm tra quyền sở hữu
    const course = await Course.findOne({ 
      _id: courseId, 
      instructor: userId 
    }).session(session);

    if (!course) {
      await session.abortTransaction();
      return res.status(403).json({ 
        success: false,
        message: 'Bạn không có quyền xóa khóa học này' 
      });
    }

    // 2. Xóa tất cả dữ liệu liên quan trong transaction
    await Promise.all([
      // Xóa các bản ghi liên quan trực tiếp
      Course.deleteOne({ _id: courseId }).session(session),
      CourseDetail.deleteOne({ courseId }).session(session),
      Enrollment.deleteMany({ course: courseId }).session(session),
      Payment.deleteMany({ course: courseId }).session(session),
      Favorite.deleteMany({ courseId }).session(session),
      
      // Cập nhật các bản ghi tham chiếu từ collection khác
      User.updateMany(
        { favorites: courseId },
        { $pull: { favorites: courseId } }
      ).session(session),
      
      User.updateMany(
        { ratedCourses: courseId },
        { $pull: { ratedCourses: courseId } }
      ).session(session)
    ]);

    await session.commitTransaction();
    res.json({ 
      success: true,
      message: 'Đã xóa khóa học và tất cả dữ liệu liên quan thành công' 
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Lỗi khi xóa khóa học:', err);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xóa khóa học',
      error: err.message 
    });
  } finally {
    session.endSession();
  }
});
module.exports = router;