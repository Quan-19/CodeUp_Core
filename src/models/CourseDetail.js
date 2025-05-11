const mongoose = require("mongoose");

const CourseDetailSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }, // Thêm required: true
  duration: String,
  type: String,
  syllabus: [String],
  video: [String],
  content: String,

});

module.exports = mongoose.model("CourseDetail", CourseDetailSchema);