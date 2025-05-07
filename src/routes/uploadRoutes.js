const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu trữ ảnh
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ định dạng ảnh (jpeg, jpg, png)'));
    }
  },
});

// Endpoint tải ảnh lên
router.post('/', upload.single('image'), (req, res) => {
  try {
    res.status(200).json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tải ảnh lên', error: err.message });
  }
});

module.exports = router;