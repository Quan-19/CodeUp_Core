const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  level: String,
  price: Number,
  duration: Number,
  imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model("Course", CourseSchema);
