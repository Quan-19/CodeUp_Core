const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { authMiddleware } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const Payment = require('../models/Payment');

// Chỉ admin mới được phép truy cập
router.use(authMiddleware, requireRole('admin'));

// Lấy danh sách tất cả người dùng với filter
router.get('/users', async (req, res) => {
  try {
    const { role, active, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (active) filter.active = active === 'true';
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Cập nhật vai trò người dùng
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Xóa người dùng
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await Enrollment.deleteMany({ student: userId });
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    res.json({ message: 'Người dùng đã được xóa' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Lấy danh sách khóa học với filter
router.get('/courses', async (req, res) => {
  try {
    const { category, published, instructor, search } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (published) filter.published = published === 'true';
    if (instructor) filter.instructor = instructor;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    
    const courses = await Course.find(filter).populate('instructor', 'username');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Xóa khóa học
router.delete('/courses/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    await Enrollment.deleteMany({ course: courseId });
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }
    res.json({ message: 'Khóa học đã được xóa' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê tổng số khóa học và người dùng
router.get('/stats', async (req, res) => {
  try {
    const courseCount = await Course.countDocuments();
    const userCount = await User.countDocuments();
    const instructorCount = await User.countDocuments({ role: 'instructor' });
    res.json({ courseCount, userCount, instructorCount });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê số lượng người dùng đăng ký khóa học trong một tháng
router.get('/enrollment-stats', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const enrollments = await Enrollment.find({
      createdAt: { $gte: startDate }
    });

    res.json({ count: enrollments.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê số lượng khóa học trong một tháng
router.get('/course-stats', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const courses = await Course.find({
      createdAt: { $gte: startDate }
    });

    res.json({ count: courses.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê top instructors trong tháng
router.get('/top-instructors', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const topInstructors = await Course.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$instructor",
          courseCount: { $sum: 1 }
        }
      },
      {
        $sort: { courseCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "instructorInfo"
        }
      },
      {
        $unwind: "$instructorInfo"
      },
      {
        $project: {
          _id: 0,
          instructorId: "$_id",
          instructorName: "$instructorInfo.username",
          courseCount: 1
        }
      }
    ]);

    res.json(topInstructors);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê doanh thu theo tháng
router.get('/revenue-stats', async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const payments = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'success'
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalRevenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    let revenueStats = payments.map((item, index, array) => {
      const currentMonth = new Date(item._id.year, item._id.month - 1);
      const prevMonthItem = array.find(prev => {
        const prevMonth = new Date(prev._id.year, prev._id.month - 1);
        return prevMonth.getTime() === new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)).getTime();
      });
      
      const changePercent = prevMonthItem 
        ? ((item.totalRevenue - prevMonthItem.totalRevenue) / prevMonthItem.totalRevenue) * 100
        : 0;
      
      return {
        ...item,
        changePercent: parseFloat(changePercent.toFixed(2))
      };
    });

    res.json(revenueStats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê doanh thu theo giảng viên
router.get('/instructor-revenue', async (req, res) => {
  try {
    const result = await Payment.aggregate([
      {
        $match: { status: 'success' }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'courseInfo.instructor',
          foreignField: '_id',
          as: 'instructorInfo'
        }
      },
      {
        $unwind: '$instructorInfo'
      },
      {
        $group: {
          _id: '$courseInfo.instructor',
          instructorName: { $first: '$instructorInfo.username' },
          totalRevenue: { $sum: '$amount' },
          courseCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê số lượng khóa học của instructor trong một tháng
router.get('/instructor-stats/:instructorId', async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const courses = await Course.find({
      instructor: instructorId,
      createdAt: { $gte: startDate }
    });

    res.json({ count: courses.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// Thống kê số lượng người dùng đăng ký khóa học trong một tháng (theo courseId)
router.get('/enrollment-stats/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const enrollments = await Enrollment.find({
      course: courseId,
      createdAt: { $gte: startDate }
    });

    res.json({ count: enrollments.length });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;