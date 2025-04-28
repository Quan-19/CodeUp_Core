const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Regex validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{4,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Đăng ký
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!['student', 'instructor'].includes(role)) {
    return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại.' });
    }

    const newUser = new User({ username, email, password, role });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ.' });
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
