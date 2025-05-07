const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  level: String,
  category:String,
  price: Number,
  duration: Number,
  imageUrl: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Bắt buộc
  published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Course", CourseSchema);
