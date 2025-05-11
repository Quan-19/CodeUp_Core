exports.requireRole = (roles) => { // Chấp nhận một mảng các roles
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      roles = [roles]; // Chuyển đổi thành mảng nếu chỉ có một role
    }

    const userModelName = req.user.constructor.modelName;
    const userRole = userModelName.toLowerCase(); // "user", "instructor", "admin"

    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
    }
    next();
  };
};