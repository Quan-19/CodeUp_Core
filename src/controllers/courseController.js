// courseController.js
const Course = require('../models/Course');
const User = require('../models/User');
const Instructor = require('../models/instructor.model');

exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructorId } = req.body;

    // Tạo khóa học mới
    const course = new Course({
      title,
      description,
      instructor: instructorId,
    });

    await course.save();

    // Tìm instructor
    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return res.status(404).json({ message: 'Không tìm thấy instructor' });
    }

    // Tăng số lượng khóa học đã tạo
    instructor.numberOfCoursesCreated += 1;

    // Thêm ID khóa học vào mảng coursesTaught của instructor
    instructor.coursesTaught.push(course._id);
    await instructor.save();

    res.status(201).json({ message: 'Khóa học đã được tạo thành công', course });
  } catch (error) {
    console.error('Lỗi khi tạo khóa học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo khóa học' });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    // Tìm student và khóa học
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res.status(404).json({ message: 'Không tìm thấy student hoặc khóa học' });
    }

    // Thêm ID khóa học vào mảng enrolledCourses của student
    student.enrolledCourses.push(course._id);
    await student.save();

    res.status(200).json({ message: 'Đăng ký khóa học thành công' });

  } catch (error) {
    console.error('Lỗi khi đăng ký khóa học:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký khóa học' });
  }
};