// instructor.model.js
const mongoose = require("mongoose");
const User = require("./user.model");

// Lấy các trường chung từ UserSchema
const { username, email, profilePicture, bio, role, password } =
  User.schema.obj;

const InstructorSchema = new mongoose.Schema({
  username: username, // Sử dụng các trường đã lấy
  email: email,
  profilePicture: profilePicture,
  bio: bio,
  password: password,
  role: {
    // Ghi đè trường role
    type: String,
    enum: ["instructor", "admin"], // Giới hạn các giá trị có thể
    default: "instructor", // Giá trị mặc định cho instructor
  },
  coursesTaught: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  teachingExperience: String,
  numberOfCoursesCreated: {
    // Thêm trường này
    type: Number,
    default: 0, // Giá trị mặc định là 0
  },
});

module.exports = mongoose.model("Instructor", InstructorSchema);
