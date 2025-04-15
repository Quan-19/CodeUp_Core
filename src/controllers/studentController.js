import { UserModel } from '~/models/User';
import { CourseModel } from '~/models/Course';

export const getUserCourses = async (req, res) => {
  const { id } = req.params;
  const user = await UserModel.findById(id).populate('purchasedCourses');
  res.json(user?.purchasedCourses || []);
};

export const buyCourse = async (req, res) => {
  const { userId, courseId } = req.body;
  const user = await UserModel.findById(userId);
  if (!user.purchasedCourses.includes(courseId)) {
    user.purchasedCourses.push(courseId);
    await user.save();
    res.json({ message: 'Mua khóa học thành công' });
  } else {
    res.status(400).json({ message: 'Đã mua khóa học này rồi' });
  }
};

export const learnCourse = async (req, res) => {
  const { courseId } = req.params;
  const course = await CourseModel.findById(courseId).populate('lessons');
  res.json(course);
};