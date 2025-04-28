const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  imageUrl: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Bắt buộc
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Course", CourseSchema);