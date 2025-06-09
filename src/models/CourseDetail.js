const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  videoUrl: String
}, { _id: false });

const ChapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  lessons: [LessonSchema]
}, { _id: false });

const QuizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(value) {
        return value >= 0 && value < this.options.length;
      },
      message: props => `Chỉ số câu trả lời (${props.value}) không hợp lệ`
    }
  }
}, { _id: false });

const CourseDetailSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true,
    unique: true // ĐẢM BẢO 1:1 VỚI COURSE
  },
  duration: String,
  type: String,
  chapters: [ChapterSchema],
  quiz: {
    type: [QuizQuestionSchema],
  }
});

module.exports = mongoose.model("CourseDetail", CourseDetailSchema);