const Course = require("../models/Course");
const User = require("../models/User");
const Instructor = require("../models/instructor");
const CourseDetail = require("../models/CourseDetail");
const  QuizProgress = require("../models/QuizProgress");

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
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy chi tiết khóa học" });
  }
};

exports.createCourse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { details, ...courseData } = req.body;
    const instructorId = req.user._id;

    // 1. TẠO COURSE TRƯỚC
    const course = new Course({
      ...courseData,
      instructor: instructorId,
      enrolledUsers: [instructorId],
    });
    await course.save({ session });

    // 2. TẠO COURSE DETAIL (NẾU CÓ)
    let courseDetail = null;
    if (details) {
      // CHUẨN HÓA DỮ LIỆU QUIZ
      if (details.quiz && Array.isArray(details.quiz)) {
        details.quiz = details.quiz.map((q) => ({
          ...q,
          correctAnswerIndex: Number(q.correctAnswerIndex),
        }));
      }

      courseDetail = new CourseDetail({
        ...details,
        courseId: course._id,
      });
      await courseDetail.save({ session });

      // 3. CẬP NHẬT REFERENCE
      course.details = courseDetail._id;
      await course.save({ session });
    }

    // 4. CẬP NHẬT INSTRUCTOR
    await Instructor.findByIdAndUpdate(
      instructorId,
      {
        $inc: { numberOfCoursesCreated: 1 },
        $addToSet: { coursesTaught: course._id },
      },
      { session }
    );

    await session.commitTransaction();

    const result = await Course.findById(course._id).populate("details").exec();

    return res.status(201).json({
      message: "Khóa học đã được tạo thành công",
      course: result,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi tạo khóa học:", error);

    // XỬ LÝ LỖI VALIDATION CHI TIẾT
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
        errors,
      });
    }

    return res.status(500).json({
      message: "Đã xảy ra lỗi khi tạo khóa học",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy student hoặc khóa học" });
    }

    // Kiểm tra student đã đăng ký chưa
    if (student.enrolledCourses.includes(course._id)) {
      return res
        .status(400)
        .json({ message: "Student đã đăng ký khóa học này" });
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
    return res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi đăng ký khóa học", error });
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
    return res
      .status(500)
      .json({ message: "Đã xảy ra lỗi khi xóa khóa học", error });
  }
};

// Quizz
exports.getQuizByCourseId = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId).populate("details");
    if (!course || !course.details) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chi tiết khóa học" });
    }

    return res.status(200).json({ quiz: course.details.quiz || [] });
  } catch (error) {
    console.error("Lỗi khi lấy quiz:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy quiz" });
  }
};

exports.createOrUpdateQuiz = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { quiz } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Tìm hoặc tạo CourseDetail
    let courseDetail = await CourseDetail.findOne({ courseId: course._id });

    if (!courseDetail) {
      courseDetail = new CourseDetail({
        courseId: course._id,
        quiz,
      });
    } else {
      courseDetail.quiz = quiz;
    }

    await courseDetail.save();

    // Cập nhật reference nếu chưa có
    if (!course.details) {
      course.details = courseDetail._id;
      await course.save();
    }

    return res.status(200).json({
      message: "Quiz đã được cập nhật",
      quiz: courseDetail.quiz,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật quiz:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật quiz",
      error: error.message,
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id.toString();
    const userRole = req.user.role;

    // Tìm khóa học
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Khóa học không tồn tại" });

    // Kiểm tra quyền (chỉ instructor hoặc admin được sửa)
    if (course.instructor.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền sửa khóa học này" });
    }

    // Các trường được phép cập nhật trong Course
    const updatableCourseFields = [
      "title",
      "description",
      "price",
      "imageUrl",
      "category",
      "duration",
      "level",
      "published",
    ];
    updatableCourseFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    // Xử lý cập nhật CourseDetail (chi tiết)
    if (req.body.details) {
      let courseDetail;

      if (course.details) {
        // Tìm CourseDetail đã có
        courseDetail = await CourseDetail.findById(course.details);
        if (!courseDetail) {
          // Nếu không tồn tại thì tạo mới
          courseDetail = new CourseDetail({ courseId });
        }
      } else {
        // Nếu course chưa có details thì tạo mới
        courseDetail = new CourseDetail({ courseId });
      }

      // Các trường được cập nhật trong CourseDetail
      const detailFields = ["duration", "type", "chapters", "quiz"];
      detailFields.forEach((field) => {
        if (req.body.details[field] !== undefined) {
          courseDetail[field] = req.body.details[field];
        }
      });

      await courseDetail.save();

      // Gán lại ObjectId của details vào Course nếu cần
      if (!course.details) {
        course.details = courseDetail._id;
      }
    }

    await course.save();

    // Populate details (bao gồm quiz) để trả về
    const updatedCourse = await Course.findById(courseId).populate("details");

    return res.status(200).json({
      message: "Cập nhật khóa học thành công",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật khóa học:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
// Tìm kiếm khóa học theo từ khóa
exports.searchCourses = async (req, res) => {
  try {
    const { keyword, category, level, minPrice, maxPrice } = req.query;
    
    const query = {};
    
    if (keyword) {
      query.title = { $regex: keyword, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (level) {
      query.level = level;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    const courses = await Course.find(query);
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Search failed', error });
  }
};

