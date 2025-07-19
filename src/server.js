require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

const Course = require("./models/Course");
const User = require("./models/User");
const Payment = require("./models/Payment");
const quizProgressRoutes = require("./routes/quizProgressRoutes");
const courseRoutes = require("./routes/courseRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const path = require("path");

const courseController = require("./controllers/courseController");
const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // tăng lên 10MB (hoặc tùy bạn)
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ Tạo QR thanh toán
app.post("/api/create-qr", async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    if (!courseId || !userId)
      return res.status(400).json({ message: "Thiếu thông tin" });

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });

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
      vnp_Amount: course.price,
      vnp_IpAddr: "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Mua khóa học ${course.title}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: "http://localhost:3000/payment-status",
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({ url: vnpayResponse });
  } catch (error) {
    console.error("Lỗi tạo QR:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// ✅ Kiểm tra thanh toán và chuyển về React home
app.get("/api/check-payment-vnpay", async (req, res) => {
  try {
    const { vnp_TxnRef, vnp_Amount, vnp_ResponseCode } = req.query;
    const [courseId, userId] = vnp_TxnRef.split("_");

    const course = await Course.findById(courseId);
    const user = await User.findById(userId);

    let paymentStatus = "failed";

    // Nếu mã phản hồi từ VNPay là thành công ("00") và user/course tồn tại
    if (vnp_ResponseCode === "00" && course && user) {
      if (!Array.isArray(course.enrolledUsers)) course.enrolledUsers = [];
      if (!Array.isArray(user.enrolledCourses)) user.enrolledCourses = [];

      const { ObjectId } = mongoose.Types;
      const userObjectId = new ObjectId(userId);
      const courseObjectId = new ObjectId(courseId);

      if (!course.enrolledUsers.some((id) => id.equals(userObjectId))) {
        course.enrolledUsers.push(userObjectId);
        await course.save();

        user.enrolledCourses.push(courseObjectId);
        await user.save();
      }

      await Payment.create({
        user: userId,
        course: courseId,
        amount: Number(vnp_Amount) / 100,
        paymentMethod: "VNPay",
        transactionId: vnp_TxnRef,
        status: "success",
      });

      paymentStatus = "success";
    }

    res.json({ paymentStatus, courseId });
  } catch (error) {
    console.error("Lỗi khi kiểm tra thanh toán:", error);
    res.status(500).json({ paymentStatus: "failed" });
  }
});

// Các route còn lại
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/favorites", favoriteRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quiz-progress", quizProgressRoutes);
// Thêm 2 route quiz:
app.get("/api/courses/:id/quiz", courseController.getQuizByCourseId);
app.post("/api/courses/:id/quiz", courseController.createOrUpdateQuiz);
// Tạo admin mặc định
const createDefaultAdmin = async () => {
  const adminEmail = "admin@codeup.com";
  const adminPassword = "Admin@123";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const admin = new User({
      username: "admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
    await admin.save();
    console.log("Admin mặc định đã tạo.");
  } else {
    console.log("Admin đã tồn tại.");
  }
};

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Đã kết nối MongoDB");
    await createDefaultAdmin();
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server đang chạy cổng", process.env.PORT || 5000)
    );
  })
  .catch((err) => console.error("Lỗi MongoDB:", err));
