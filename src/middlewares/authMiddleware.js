const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization (dạng "Bearer token")
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Không có token" });
    }

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user theo id trong payload token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Token không hợp lệ" });
    }

    // Gán thông tin user vào req để các middleware sau dùng
    req.user = user;

    next();
  } catch (err) {
    // Nếu lỗi (token sai, hết hạn, v.v) thì trả về lỗi 401
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

module.exports = authMiddleware;
