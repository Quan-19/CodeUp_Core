const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Tạo khóa học mới
exports.createCourse = async (req, res) => {
  try {
    const instructorId = req.user.id; // Lấy ID người dùng từ middleware authenticate

    const courseData = {
      ...req.body,
      instructor: instructorId, // Gán instructor từ req.user.id
      published: false,
    };

    const course = new Course(courseData);
    await course.save();

    res.status(201).json(course);
  } catch (err) {
    console.error("Lỗi khi thêm khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm nội dung khóa học
exports.addCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;
    
    // Kiểm tra người dạy có phải chủ khóa học không
    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa khóa học này' });
    }

    // Thêm nội dung mới
    course.content.push(req.body);
    await course.save();

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Thống kê khóa học của người dạy
exports.getInstructorStats = async (req, res) => {
  try {
    const instructorId = req.user.id;
    
    // Lấy tất cả khóa học của người dạy
    const courses = await Course.find({ instructor: instructorId });
    
    // Lấy thông tin enrollment
    const enrollments = await Enrollment.find({ 
      course: { $in: courses.map(c => c._id) } 
    }).populate('student', 'profile.name');
    
    // Tính toán thống kê
    const stats = {
      totalCourses: courses.length,
      totalStudents: enrollments.length,
      earnings: courses.reduce((sum, course) => sum + course.price, 0),
      courses: courses.map(course => ({
        ...course.toObject(),
        students: enrollments.filter(e => e.course.equals(course._id)).length
      }))
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
console.log("Dữ liệu nhận được từ frontend:", req.body);
console.log("Thông tin người dùng:", req.user);