// middlewares/auth.js
const jwt = require('jsonwebtoken');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin người dùng từ token
    const userId = decoded.userId;
    const role = decoded.role;

    // Tìm người dùng trong model User
    const user = await mongoose.model('User').findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'Không tìm thấy người dùng' });
    }

    // Thêm thông tin người dùng và vai trò vào req
    req.user = user;
    req.user.role = role; // Thêm vai trò vào req.user

    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }
};

exports.requireRole = (roles) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) { // Sử dụng req.user.role
      return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
    }
    next();
  };
};