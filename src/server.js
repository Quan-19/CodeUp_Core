require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const Course = require("./models/Course");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");
const uploadRoutes = require("./routes/uploadRoutes");
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");

// Middleware
app.use(cors());
app.use(express.json());

// Tạo QR thanh toán
app.post("/api/create-qr", async (req, res) => {
  console.log("Received body:", req.body);
  try {
    const { courseId, userId } = req.body;

    if (!courseId || !userId) {
      return res.status(400).json({ message: "Thiếu courseId hoặc userId" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Tạo chuỗi txnRef để chứa cả courseId và userId, ví dụ: courseId_userId
    const txnRef = `${courseId}_${userId}`;

    const vnpay = new VNPay({
      tmnCode: "0DGDY7EQ",
      secureSecret: "6Y98E797875IOGBBHRR48C04K0FUBZZT",
      vnpayHost: "https://sandbox.vnpayment.vn",
      testMode: true,
      hashAlgorithm: "SHA512",
      loggerFn: ignoreLogger,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayResponse = await vnpay.buildPaymentUrl({
      vnp_Amount: course.price, // nhân 100 nếu là VNĐ
      vnp_IpAddr: "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Mua khóa học ${course.title}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: "http://localhost:5000/api/check-payment-vnpay",
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({ url: vnpayResponse });
  } catch (error) {
    console.error("Lỗi khi tạo QR:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
});

// Kiểm tra thanh toán
app.get("/api/check-payment-vnpay", async (req, res) => {
  try {
    const { vnp_TxnRef } = req.query;
    const [courseId, userId] = vnp_TxnRef.split("_");

    // Tìm course và user
    const course = await Course.findById(courseId)
      .populate("details")
      .populate("instructor");

    const user = await User.findById(userId);

    if (!course || !user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy khóa học hoặc người dùng" });
    }

    // Đảm bảo enrolledUsers và enrolledCourses là mảng
    if (!Array.isArray(course.enrolledUsers)) {
      course.enrolledUsers = [];
    }
    if (!Array.isArray(user.enrolledCourses)) {
      user.enrolledCourses = [];
    }

    const { ObjectId } = mongoose.Types;
    const userObjectId = new ObjectId(userId);
    const courseObjectId = new ObjectId(courseId);

    // Kiểm tra nếu user chưa có trong enrolledUsers
    if (!course.enrolledUsers.some((id) => id.equals(userObjectId))) {
      course.enrolledUsers.push(userObjectId);
      await course.save();

      user.enrolledCourses.push(courseObjectId);
      await user.save();
    }

    // Trả về dữ liệu đầy đủ
    return res.status(200).json({
      message: "Thanh toán thành công",
      course: {
        ...course.toObject(),
        details: course.details || {},
      },
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra thanh toán:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
});

// Các routes khác
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));

// Tạo tài khoản admin mặc định
const createDefaultAdmin = async () => {
  const adminEmail = "admin@codeup.com";
  const adminPassword = "Admin@123";
  const adminRole = "admin";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const admin = new User({
      username: "admin",
      email: adminEmail,
      password: adminPassword,
      role: adminRole,
    });
    await admin.save();
    console.log("Tài khoản admin mặc định đã được tạo.");
  } else {
    console.log("Tài khoản admin đã tồn tại.");
  }
};

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Đã kết nối với MongoDB");
    await createDefaultAdmin();
  })
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
