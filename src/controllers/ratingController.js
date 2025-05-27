const Rating = require("../models/Rating");
const Course = require("../models/Course");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.submitRating = async (req, res) => {
  const { courseId, rating } = req.body;
  const userId = req.user._id;

  if (!rating || rating < 0.5 || rating > 5) {
    return res.status(400).json({ message: "Điểm đánh giá không hợp lệ" });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course || !course.enrolledUsers.includes(userId.toString())) {
      return res.status(403).json({ message: "Bạn chưa sở hữu khóa học này" });
    }

    let existing = await Rating.findOne({ userId, courseId });

    if (existing) {
      existing.rating = rating;
      await existing.save();
    } else {
      await Rating.create({ userId, courseId, rating });
    }

    // Cập nhật lại averageRating và ratingCount cho Course
    const result = await Rating.aggregate([
      { $match: { courseId: new ObjectId(courseId) } },
      {
        $group: {
          _id: "$courseId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      course.averageRating = result[0].averageRating;
      course.ratingCount = result[0].ratingCount;
      await course.save();
    }

    res.json({ message: "Đánh giá đã được lưu thành công", rating });
  } catch (err) {
    console.error("Lỗi khi lưu đánh giá:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.getAverageRating = async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await Rating.aggregate([
      { $match: { courseId: new ObjectId(courseId) } },
      {
        $group: {
          _id: "$courseId",
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.json({ averageRating: 0, ratingCount: 0 });
    }

    res.json({
      averageRating: result[0].averageRating,
      ratingCount: result[0].ratingCount,
    });
  } catch (err) {
    console.error("Lỗi khi tính điểm trung bình:", err);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};