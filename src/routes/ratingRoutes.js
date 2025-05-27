const express = require("express");
const router = express.Router();

const authenticate = require("../middlewares/authMiddleware");
const ratingController = require("../controllers/ratingController");

router.post("/", authenticate, ratingController.submitRating);
router.get("/:courseId", ratingController.getAverageRating);

module.exports = router;