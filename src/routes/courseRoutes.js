// backend/routes/courseRoutes.js
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

// ✅ GET khóa học theo ID: /api/courses/:id
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    const detail = await CourseDetail.findOne({ courseId: course._id });

    res.json({
      ...course.toObject(),
      details: detail || null,
    });
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
    });
    await newCourse.save();

    // Lưu chi tiết khóa học nếu có
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

module.exports = router;
