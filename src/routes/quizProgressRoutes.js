const express = require("express");
const router = express.Router();
const QuizProgress = require("../models/QuizProgress");

// POST: Lưu tiến trình quiz
router.post("/", async (req, res) => {
  try {
    const {
      userId,
      courseId,
      quizData,
      userAnswers,
      currentQuestionIndex,
      timeRemaining,
      submitted,
      score,
      showExplanation,
      started,
    } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Thiếu userId hoặc courseId" });
    }

    const existing = await QuizProgress.findOne({ userId, courseId });

    if (existing) {
      existing.quizData = quizData;
      existing.userAnswers = userAnswers;
      existing.currentQuestionIndex = currentQuestionIndex;
      existing.timeRemaining = timeRemaining;
      existing.submitted = submitted;
      existing.score = score;
      existing.showExplanation = showExplanation;
      existing.started = started;
      await existing.save();
      return res.json({ message: "Đã cập nhật tiến trình", progress: existing });
    } else {
      const newProgress = new QuizProgress({
        userId,
        courseId,
        quizData,
        userAnswers,
        currentQuestionIndex,
        timeRemaining,
        submitted,
        score,
        showExplanation,
        started,
      });
      await newProgress.save();
      return res.status(201).json({ message: "Đã tạo tiến trình mới", progress: newProgress });
    }
  } catch (err) {
    console.error("Lỗi khi lưu tiến trình:", err);
    return res.status(500).json({ error: "Lỗi server khi lưu tiến trình" });
  }
});
router.get('/:userId/:courseId', async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const progress = await QuizProgress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({ message: 'No progress found' });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});
module.exports = router;
