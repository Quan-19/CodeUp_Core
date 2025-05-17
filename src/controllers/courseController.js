// courseController.js
const Course = require('../models/Course');
const User = require('../models/User');
const Instructor = require('../models/instructor.model');
const CourseDetail = require('../models/CourseDetail'); 
exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId)
      .populate('instructor')
      .populate('details') // Thêm populate cho details
      .lean();

    if (!course) {
      return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết khóa học:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết khóa học' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructorId, details } = req.body;

    // Tạo CourseDetail trước nếu có
    let courseDetail = null;
    if (details) {
      courseDetail = new CourseDetail(details);
      await courseDetail.save();
    }

    // Tạo khóa học mới với reference đến details
    const course = new Course({
      title,
      description,
      instructor: instructorId,
      details: courseDetail?._id
    });

    await course.save();

    // Cập nhật instructor
    const instructor = await Instructor.findById(instructorId);
    if (instructor) {
      instructor.numberOfCoursesCreated += 1;
      instructor.coursesTaught.push(course._id);
      await instructor.save();
    }

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