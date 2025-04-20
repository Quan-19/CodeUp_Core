// server.js (hoặc index.js)
require("dotenv").config();
// <-- Thêm dòng này

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const Course = require("./models/Course");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");



// Middleware
app.use(cors());
app.use(express.json());

// Routes
  app.use("/api/courses", courseRoutes);
  app.use("/api/auth", authRoutes);
  app.use('/api', courseRoutes); 
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

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Đã kết nối với MongoDB"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
