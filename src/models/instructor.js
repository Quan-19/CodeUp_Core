// instructor.model.js
const mongoose = require("mongoose");
const User = require("./user.model");

const InstructorSchema = new mongoose.Schema({
  ...User.schema.obj, // Kế thừa từ UserSchema
  coursesTaught: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  teachingExperience: String,
});

module.exports = mongoose.model("Instructor", mongoose.model("Instructor", InstructorSchema));