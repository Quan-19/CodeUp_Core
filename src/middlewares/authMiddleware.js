const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const userId = req.params.id || req.body.userId || req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'Thiếu ID người dùng' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = authMiddleware;