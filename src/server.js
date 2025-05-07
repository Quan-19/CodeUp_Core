// server.js
require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const Course = require("./models/Course");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const User = require('./models/User');
const uploadRoutes = require('./routes/uploadRoutes');


// Middleware
app.use(cors());
app.use(express.json());

// Routes
  app.use("/api/courses", courseRoutes);
  app.use("/api/auth", authRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/uploads', express.static('uploads')); // Cung cấp thư mục uploads dưới dạng tĩnh
// Ví dụ với Express.js
app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id); // Mongoose
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});
// Tạo tài khoản admin mặc định
const createDefaultAdmin = async () => {
  const adminEmail = 'admin@codeup.com';
  const adminPassword = 'Admin@123'; // Mật khẩu mạnh
  const adminRole = 'admin';

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const admin = new User({
      username: 'admin',
      email: adminEmail,
      password: adminPassword,
      role: adminRole,
    });
    await admin.save();
    console.log('Tài khoản admin mặc định đã được tạo.');
  } else {
    console.log('Tài khoản admin đã tồn tại.');
  }
};
// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Đã kết nối với MongoDB');
    await createDefaultAdmin();
  })
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});