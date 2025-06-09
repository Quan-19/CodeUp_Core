const QuizProgress = require('../models/QuizProgress');

export const saveProgress =  async (updatedData) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const userId = user?.id || user?._id;

  if (!userId || !token) {
    console.error("Không có userId hoặc token. Không thể lưu tiến trình.");
    return;
  }

  try {
    await axios.post("/api/quiz-progress", {
      userId,
      courseId,
      quizData,
      ...updatedData
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Đã lưu tiến trình quiz thành công.");
  } catch (error) {
    console.error("Lỗi khi lưu tiến trình quiz:", error.response?.data || error.message);
  }
};


export const getProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    console.log('Fetching progress for:', userId, courseId);
    
    const progress = await QuizProgress.findOne({ userId, courseId });
    
    if (!progress) {
      console.log('Progress not found');
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    console.log('Found progress:', progress);
    res.status(200).json(progress);
  } catch (error) {
    console.error('Error fetching quiz progress:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch quiz progress',
      details: error.message
    });
  }
};

export const deleteProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    console.log('Deleting progress for:', userId, courseId);
    
    const result = await QuizProgress.deleteOne({ userId, courseId });
    
    console.log('Delete result:', result);
    res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting quiz progress:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete progress',
      details: error.message
    });
  }
};