const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  level: String,
  price: Number,
  duration: Number,
  imageUrl: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  published: { type: Boolean, default: false },
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  details: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CourseDetail"
  }
}, { timestamps: true });

// Middleware tự động thêm instructor vào enrolledUsers nếu chưa có
CourseSchema.pre("save", function(next) {
  if (this.instructor && !this.enrolledUsers.includes(this.instructor)) {
    this.enrolledUsers.push(this.instructor);
  }
  next();
});

module.exports = mongoose.model("Course", CourseSchema);