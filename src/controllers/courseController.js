const Course = require("../models/Course");

// Lấy danh sách tất cả khóa học (ai cũng có thể xem)
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ", details: error.message });
  }
};

// Lấy chi tiết một khóa học (ai cũng có thể xem)
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("instructor", "name email");
    if (!course)
      return res.status(404).json({ error: "Không tìm thấy khóa học" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ", details: error.message });
  }
};

// Tạo mới khóa học (chỉ instructor được phép)
exports.createCourse = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const courseData = {
      ...req.body,
      instructor: instructorId,
      published: false,
    };

    const course = new Course(courseData);
    await course.save();

    console.log("Dữ liệu nhận được từ frontend:", req.body);
    console.log("Thông tin người dùng:", req.user);

    res.status(201).json(course);
  } catch (err) {
    console.error("Lỗi khi thêm khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Thêm nội dung vào khóa học (chỉ instructor là chủ khóa học mới được phép)
exports.addCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa khóa học này" });
    }

    course.content.push(req.body);
    await course.save();

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
