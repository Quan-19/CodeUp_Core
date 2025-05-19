const Course = require("../models/Course");
const User = require("../models/User");
const Instructor = require("../models/instructor.model");
const CourseDetail = require("../models/CourseDetail");

exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId)
      .populate("instructor")
      .populate("details")
      .lean();

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Kiểm tra user đã đăng nhập chưa
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Bạn cần đăng nhập để truy cập khóa học" });
    }

    const userId = req.user._id.toString();

    // Vì đang dùng .lean() nên course.instructor là object, kiểm tra id chính xác
    const isOwner = course.instructor._id.toString() === userId;

    // enrolledUsers có thể là array ObjectId (string), so sánh bằng chuỗi
    const isEnrolled = course.enrolledUsers.some(
      (userIdInCourse) => userIdInCourse.toString() === userId
    );

    if (!isOwner && !isEnrolled) {
      return res
        .status(403)
        .json({ message: "Bạn cần mua khóa học để truy cập." });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết khóa học:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy chi tiết khóa học" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, level, price, duration, imageUrl, details } = req.body;
    const instructorId = req.user._id; // lấy từ token đăng nhập

    // Nếu có chi tiết khóa học, tạo CourseDetail trước
    let courseDetail = null;
    if (details) {
      courseDetail = new CourseDetail(details);
      await courseDetail.save();
    }

    const course = new Course({
      title,
      description,
      category,
      level,
      price,
      duration,
      imageUrl,
      instructor: instructorId,
      details: courseDetail ? courseDetail._id : null,
      enrolledUsers: [instructorId], // Gán instructor vào enrolledUsers
    });

    await course.save();

    // Cập nhật số lượng khóa học của giảng viên và danh sách khóa học đã dạy
    const instructor = await Instructor.findById(instructorId);
    if (instructor) {
      instructor.numberOfCoursesCreated = (instructor.numberOfCoursesCreated || 0) + 1;
      if (!instructor.coursesTaught.includes(course._id)) {
        instructor.coursesTaught.push(course._id);
      }
      await instructor.save();
    }

    return res.status(201).json({ message: "Khóa học đã được tạo thành công", course });
  } catch (error) {
    console.error("Lỗi khi tạo khóa học:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi tạo khóa học", error });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res.status(404).json({ message: "Không tìm thấy student hoặc khóa học" });
    }

    // Kiểm tra student đã đăng ký chưa
    if (student.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ message: "Student đã đăng ký khóa học này" });
    }

    // Thêm khóa học vào danh sách khóa học của student
    student.enrolledCourses.push(course._id);
    await student.save();

    // Thêm student vào danh sách enrolledUsers của course (nếu chưa có)
    if (!course.enrolledUsers.includes(student._id)) {
      course.enrolledUsers.push(student._id);
      await course.save();
    }

    return res.status(200).json({ message: "Đăng ký khóa học thành công" });
  } catch (error) {
    console.error("Lỗi khi đăng ký khóa học:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi đăng ký khóa học", error });
  }
};

//xóa khóa học
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Tìm khóa học theo ID
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Xóa khóa học
    await Course.findByIdAndDelete(courseId);

    // Cập nhật số lượng khóa học của giảng viên
    const instructor = await Instructor.findById(course.instructor);
    if (instructor) {
      instructor.numberOfCoursesCreated -= 1;
      instructor.coursesTaught = instructor.coursesTaught.filter(
        (courseId) => courseId.toString() !== course._id.toString()
      );
      await instructor.save();
    }

    return res.status(200).json({ message: "Khóa học đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa khóa học:", error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi xóa khóa học", error });
  }
};