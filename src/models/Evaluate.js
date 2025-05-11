const mongoose = require("mongoose");

const EvaluateSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }, // Thêm required: true
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Thêm required: true
  rating: { type: Number, min: 1, max: 5, required: true }, // Đánh giá từ 1 đến 5
  comment: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Evaluate", EvaluateSchema);