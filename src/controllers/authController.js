// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

const createToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }
    const token = createToken(user);
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{4,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!username || username.length < 4) {
    return res.status(400).json({ error: "Tên tài khoản phải từ 4 ký tự trở lên" });
  }

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Email không hợp lệ" });
  }

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({
      error: "Mật khẩu phải từ 4 ký tự, có chữ in hoa, thường, số và ký tự đặc biệt"
    });
  }

  try {
    const existingEmail = await User.findOne({ email });
    const existingUser = await User.findOne({ username });

    if (existingEmail) return res.status(400).json({ error: "Email đã được sử dụng" });
    if (existingUser) return res.status(400).json({ error: "Tên tài khoản đã tồn tại" });

    const user = new User({ username, email, password });
    await user.save();

    const token = createToken(user);
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};

