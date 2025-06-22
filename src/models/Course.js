  const mongoose = require("mongoose");
  const CourseSchema = new mongoose.Schema(
    {
      title: String,
      description: String,
      category: String,
      level: String,
      price: Number,
      duration: Number,
      imageUrl: String,
      instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      published: { type: Boolean, default: true },
      enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      details: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseDetail",
      },
      averageRating: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  // Middleware tự động thêm instructor vào enrolledUsers nếu chưa có
  CourseSchema.pre("save", function (next) {
    const instructorId = this.instructor?.toString();
    const adminId = "684eb1ede622505e20f94474";

    if (
      instructorId &&
      !this.enrolledUsers.some((id) => id.toString() === instructorId)
    ) {
      this.enrolledUsers.push(this.instructor);
    }

    if (!this.enrolledUsers.some((id) => id.toString() === adminId)) {
      this.enrolledUsers.push(new mongoose.Types.ObjectId(adminId));
    }

    next();
  });

  module.exports = mongoose.model("Course", CourseSchema);
