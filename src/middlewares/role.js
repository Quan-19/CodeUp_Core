exports.requireRole = (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
      }
      next();
    };
  };