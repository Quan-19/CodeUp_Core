// src/controllers/courseController.js
const Course = require("../models/Course");
app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id); // Hoặc phương thức tương ứng của bạn
    if (!course) {
      return res.status(404).send("Khóa học không tìm thấy");
    }
    res.json(course);
  } catch (error) {
    res.status(500).send("Lỗi server");
  }
});
// Lấy danh sách khóa học
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ", details: error.message });
  }
};

// Lấy chi tiết khóa học
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course)
      return res.status(404).json({ error: "Không tìm thấy khóa học" });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ", details: error.message });
  }
};

// Tạo mới khóa học
exports.createCourse = async (req, res) => {
  const { title, description, category, level, price, duration, imageUrl } =
    req.body;
  const newCourse = new Course({
    title,
    description,
    category,
    level,
    price,
    duration,
    imageUrl,
  });

  try {
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ error: "Lỗi tạo khóa học", details: error.message });
  }
};