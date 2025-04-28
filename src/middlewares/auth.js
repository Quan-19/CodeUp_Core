const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Thêm thông tin người dùng vào req.user
    next();
  } catch (err) {
    res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }
};
console.log("Token nhận được:", req.header("Authorization"));