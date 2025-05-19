const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const CourseDetail = require("../models/CourseDetail");

// ✅ GET tất cả khóa học: /api/courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ✅ GET khóa học theo ID: /api/courses/:id?userId=abc123
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor');

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    const { userId } = req.query;

    // Kiểm tra quyền truy cập
    if (!userId || !course.enrolledUsers.includes(userId)) {
      return res.status(403).json({ message: "Bạn chưa mua khóa học này" });
    }

    // Lấy chi tiết khóa học riêng
    const details = await CourseDetail.findOne({ courseId: course._id });

    const responseData = {
      ...course.toObject(),
      details: details || {}
    };

    res.json(responseData);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});


// ✅ POST tạo mới khóa học: /api/courses
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      details,
      instructor,
    } = req.body;

    if (!instructor) {
      return res
        .status(400)
        .json({ message: "ID người tạo khóa học không tồn tại." });
    }

    const newCourse = new Course({
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      instructor,
      enrolledUsers: [], // thêm mặc định
    });
    await newCourse.save();

    // Nếu có chi tiết khóa học thì lưu
    if (details) {
      const newDetail = new CourseDetail({
        courseId: newCourse._id,
        ...details,
      });
      await newDetail.save();
    }

    res.status(201).json(newCourse);
  } catch (err) {
    console.error("Lỗi khi thêm khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

//Xóa khóa học
router.delete("/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }
    res.json({ message: "Xóa khóa học thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});
module.exports = router;