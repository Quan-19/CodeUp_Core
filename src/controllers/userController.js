const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi lấy danh sách người dùng" });
  }
};

//xóa người dùng
const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    res.status(200).json({ message: "Người dùng đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa người dùng:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi xóa người dùng" });
  }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi lấy thông tin người dùng" });
  }
};

//sửa thông tin người dùng
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, bio } = req.body;
  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // 🔍 Kiểm tra username đã tồn tại ở người dùng khác chưa
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Tên người dùng đã tồn tại" });
      }
      user.username = username;
    }

    if (bio) {
      user.bio = bio;
    }

    if (profilePicture) {
      user.profilePicture = profilePicture;
    }

    // 🛡️ Bỏ qua validation cho trường role
    user.$ignore('role');
    
    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
    
    // Xử lý lỗi cụ thể
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Dữ liệu không hợp lệ",
        errors: error.errors 
      });
    }
    
    res.status(500).json({ 
      message: "Đã xảy ra lỗi khi cập nhật thông tin người dùng"
    });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getUserById,
  updateUser,
};