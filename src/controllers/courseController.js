const Course = require('../models/Course');

// Lấy tất cả khóa học
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy khóa học nổi bật (ví dụ: 4 khóa học mới nhất)
exports.getFeaturedCourses = async (req, res) => {
  try {
    const featuredCourses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(4);
    res.json(featuredCourses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Tạo khóa học mới (dành cho admin)
exports.createCourse = async (req, res) => {
  const course = new Course({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    level: req.body.level,
    price: req.body.price,
    duration: req.body.duration,
    imageUrl: req.body.imageUrl || 'https://via.placeholder.com/300x200'
  });

  try {
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};