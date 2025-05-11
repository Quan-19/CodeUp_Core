// admin.model.js
const mongoose = require("mongoose");
const User = require("./user.model");

const AdminSchema = new mongoose.Schema({
  ...User.schema.obj, // Kế thừa từ UserSchema
  permissions: [String], // Ví dụ: ["manageUsers", "manageCourses"]
});

module.exports = mongoose.model("Admin", mongoose.model("Admin", AdminSchema));