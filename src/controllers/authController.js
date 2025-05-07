const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Đăng ký người dùng
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  console.log("Đang đăng ký người dùng:", req.body);

  try {
    // Kiểm tra email hoặc username đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email hoặc username đã tồn tại" });
    }

    // KHÔNG hash mật khẩu tại đây, để schema tự xử lý
    const user = new User({
      username,
      email,
      password,
      role,
    });

    await user.save();

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi đăng ký người dùng" });
  }
};

// Đăng nhập người dùng
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu không đúng" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi đăng nhập" });
  }
};
