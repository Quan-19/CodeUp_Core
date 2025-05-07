const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authController = require("../controllers/authController");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Regex validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{4,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Đăng ký người dùng mới
router.post("/register", authController.register);

// Đăng nhập người dùng
router.post("/login", authController.login);

module.exports = router;
