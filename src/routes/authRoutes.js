const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Regex validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{4,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Đăng ký
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || username.length < 4) {
    return res.status(400).json({ error: "Tên tài khoản phải từ 4 ký tự." });
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Email không hợp lệ." });
  }
  if (!password || !passwordRegex.test(password)) {
    return res.status(400).json({
      error: "Mật khẩu cần có chữ hoa, thường, số, ký tự đặc biệt và >= 4 ký tự."
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingUser) return res.status(400).json({ error: "Email đã tồn tại." });
    if (existingUsername) return res.status(400).json({ error: "Tên tài khoản đã tồn tại." });

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      token,
      user: {
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ." });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: "Email hoặc mật khẩu không đúng." });
    }
    console.log(" Mật khẩu nhập vào:", password);
    console.log(" Mật khẩu hash trong DB:", user.password);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ." });
  }
});

module.exports = router;
