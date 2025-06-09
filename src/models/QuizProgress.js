const mongoose = require("mongoose");

const QuizProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  quizData: { type: Array, default: [] },
  userAnswers: { type: Object, default: {} },
  currentQuestionIndex: { type: Number, default: 0 },
  timeRemaining: { type: Number, default: 1200 },
  submitted: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  showExplanation: { type: Boolean, default: false },
  started: { type: Boolean, default: false },
});

module.exports = mongoose.model("QuizProgress", QuizProgressSchema);
  