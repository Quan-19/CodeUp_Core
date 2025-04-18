// src/routes/courseRoutes.js

const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// Danh sách khóa học (dùng cho giao diện chính)
router.get("/", courseController.getCourses);

// Lấy chi tiết khóa học theo ID
router.get("/:id", async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) return res.status(404).json({ error: "Không tìm thấy khóa học" });
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Lỗi máy chủ", details: error.message });
    }
  });
// Tạo mới khóa học 
router.post("/", courseController.createCourse); 

module.exports = router;
