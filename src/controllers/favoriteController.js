const Favorite = require("../models/Favorite");

exports.addFavorite = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  try {
    await Favorite.create({ userId, courseId });
    res.json({ message: "Đã thêm vào yêu thích" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Đã tồn tại trong yêu thích" });
    }
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.removeFavorite = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  try {
    await Favorite.findOneAndDelete({ userId, courseId });
    res.json({ message: "Đã xóa khỏi yêu thích" });
  } catch {
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.getFavorites = async (req, res) => {
  const userId = req.user.id;

  try {
    const favorites = await Favorite.find({ userId }).populate("courseId");
    // Lọc bỏ courseId null
    const courses = favorites
      .map((f) => f.courseId)
      .filter((course) => course !== null);
    res.json(courses);
  } catch {
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};