const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Frontend', 'Backend', 'Fullstack', 'Mobile', 'Data Science']
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // Số giờ
    required: true
  },
  // imageUrl: {
  //   type: String,
  //   default: 'https://via.placeholder.com/300x200'
  // },
  // createdAt: {
  //   type: Date,
  //   default: Date.now
  // },
  // updatedAt: {
  //   type: Date,
  //   default: Date.now
  // }
});

module.exports = mongoose.model('Course', CourseSchema);
