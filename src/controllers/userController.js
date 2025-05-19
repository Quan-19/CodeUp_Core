const User = require('../models/User');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách người dùng' });
  }
};

//xóa người dùng
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.status(200).json({ message: 'Người dùng đã được xóa thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa người dùng' });
  }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
  }
}

//sửa thông tin người dùng
  const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, password } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }
      // Cập nhật thông tin người dùng
      user.name = name || user.name;
      user.email = email || user.email;
      user.password = password || user.password;
      await user.save();
      res.status(200).json({ message: 'Thông tin người dùng đã được cập nhật thành công', user });
    }
    catch (error) {
      console.error('Lỗi khi cập nhật thông tin người dùng:', error);
      res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng' });
    }
  }

module.exports = {
  getAllUsers,deleteUser,getUserById,updateUser
};