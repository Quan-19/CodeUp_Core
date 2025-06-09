const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    let userId;

    // Ưu tiên xác thực bằng token nếu có
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded.userId;
      } catch (err) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }
    }

    // Nếu không có token hoặc token không chứa userId, lấy từ request
    if (!userId) {
      userId = req.params.id || req.body.userId || req.query.userId;
    }

    if (!userId) {
      return res.status(400).json({ message: "Thiếu ID người dùng" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Lỗi xác thực:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};



module.exports = authMiddleware;