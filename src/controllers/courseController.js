// src/controllers/courseController.js

const Course = require("../models/Course");

// GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find({}, "title price description"); // Chỉ lấy 3 trường
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách khóa học" });
  }
};

// GET /api/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Không tìm thấy khóa học" });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy chi tiết khóa học" });
  }
};

// POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!title || !description || !category || price == null || !duration) {
      return res.status(400).json({
        error: "Vui lòng điền đầy đủ các trường: title, description, category, price, duration."
      });
    }

    // Tạo mới khóa học
    const newCourse = new Course({
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl
    });

    await newCourse.save();

    res.status(201).json(newCourse);
  } catch (err) {
    console.error("Lỗi khi thêm khóa học:", err);
    res.status(400).json({
      error: "Không thể thêm khóa học",
      details: err.message
    });
  }
};