const mongoose = require("mongoose");

const CourseDetailSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  duration: String,
  syllabus: [String],
  content: String,
});

module.exports = mongoose.model("CourseDetail", CourseDetailSchema);