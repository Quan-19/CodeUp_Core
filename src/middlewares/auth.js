const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Middleware để xác thực người dùng và phân quyền
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin người dùng từ token
    const userId = decoded.userId;
    const role = decoded.role;

    // Xác định model dựa trên vai trò
    let userModel;
    switch (role) {
      case 'student':
        userModel = mongoose.model('User');
        break;
      case 'instructor':
        userModel = mongoose.model('Instructor');
        break;
      case 'admin':
        userModel = mongoose.model('User'); // Hoặc model Admin nếu bạn có
        break;
      default:
        return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    // Tìm người dùng trong model tương ứng
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'Không tìm thấy người dùng' });
    }

    // Thêm thông tin người dùng và vai trò vào req
    req.user = user;
    req.user.id = user._id;
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