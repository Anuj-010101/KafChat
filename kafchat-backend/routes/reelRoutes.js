const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB limit

const {
  createReel,
  getReelsFeed,
  toggleLikeReel,
  getReelLikers,
  downloadReel,
  addComment,
} = require("../controllers/reelController");

router.use(protect);

router.get("/feed", getReelsFeed);
router.post("/", upload.single("file"), createReel);
router.post("/:reelId/like", toggleLikeReel);
router.get("/:reelId/likers", getReelLikers);
router.get("/:reelId/download", downloadReel);
router.post("/:reelId/comment", addComment);

module.exports = router;