const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  profile: {
    name: String,
    avatar: String,
    bio: String,
    // Thêm các trường khác tùy theo role
    specialization: { type: String }, // Cho instructor
    studentId: { type: String }       // Cho student
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password trước khi lưu
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', UserSchema);