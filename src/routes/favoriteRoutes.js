const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Favorite = require("../models/Favorite");

// Toggle favorite (thêm hoặc xóa)
router.post("/toggle", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(400).json({ message: "Thiếu courseId" });
  }

  try {
    // Kiểm tra đã tồn tại favorite chưa
    const existingFavorite = await Favorite.findOne({ userId, courseId });

    if (existingFavorite) {
      // Nếu có rồi thì xóa
      await Favorite.deleteOne({ _id: existingFavorite._id });
      return res.json({ message: "Đã xóa khỏi yêu thích", favorited: false });
    } else {
      // Nếu chưa có thì thêm mới
      await Favorite.create({ userId, courseId });
      return res.json({ message: "Đã thêm vào yêu thích", favorited: true });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

// Lấy danh sách favorite của user
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const favorites = await Favorite.find({ userId }).populate("courseId");
    const courses = favorites.map(fav => fav.courseId);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

module.exports = router;