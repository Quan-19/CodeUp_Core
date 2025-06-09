const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const CourseDetail = require("../models/CourseDetail");
const courseController = require("../controllers/courseController");

// Quizz

router.get("/:id/quiz", courseController.getQuizByCourseId);

router.post("/:id/quiz", courseController.createOrUpdateQuiz);
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
    const course = await Course.findById(req.params.id).populate("instructor");

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Bỏ đoạn kiểm tra quyền truy cập ở đây

    // Lấy chi tiết khóa học riêng
    const details = await CourseDetail.findOne({ courseId: course._id });

    const responseData = {
      ...course.toObject(),
      details: details || {},
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
router.put("/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

    // Cập nhật các trường cơ bản
    const updatableFields = ["title", "description", "price", "imageUrl", "category", "duration", "level"];
    updatableFields.forEach(field => req.body[field] !== undefined && (course[field] = req.body[field]));

    // Xử lý details
    if (req.body.details) {
      let courseDetail = await CourseDetail.findOne({ courseId: course._id });

      if (!courseDetail) {
        courseDetail = new CourseDetail({ courseId: course._id });
      }

      // Cập nhật từng trường
      const detailFields = ["type", "chapters", "quiz"];
      detailFields.forEach(field => {
        if (req.body.details[field] !== undefined) {
          courseDetail[field] = req.body.details[field];
        }
      });

      await courseDetail.save();
      
      // Đảm bảo đồng bộ reference
      if (!course.details || course.details.toString() !== courseDetail._id.toString()) {
        course.details = courseDetail._id;
      }
    }

    await course.save();
    const updatedCourse = await Course.findById(courseId).populate('details');

    return res.status(200).json({ 
      message: "Cập nhật thành công", 
      course: updatedCourse 
    });
  } catch (error) {
    console.error("Lỗi cập nhật:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});
module.exports = router;
