const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Regex kiểm tra
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{4,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Đăng ký
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || username.length < 4) {
    return res.status(400).json({ error: "Tên tài khoản phải từ 4 ký tự trở lên." });
  }

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Email không hợp lệ." });
  }

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({
      error: "Mật khẩu phải từ 4 ký tự, có chữ hoa, thường, số và ký tự đặc biệt."
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingUser) return res.status(400).json({ error: "Email đã được sử dụng." });
    if (existingUsername) return res.status(400).json({ error: "Tên tài khoản đã tồn tại." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "Đăng ký thành công." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ." });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email không tồn tại." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Sai mật khẩu." });

    const token = jwt.sign({ id: user._id }, "secret_key", { expiresIn: "1d" });

    res.json({
      token,
      user: {
        username: user.username, // ← Đảm bảo bạn có username ở đây!
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ." });
  }
});

module.exports = router;
