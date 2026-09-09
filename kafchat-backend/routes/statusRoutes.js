const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");
const {
  createStatus,
  getStatusFeed,
  viewStatus,
  replyToStatus,
  deleteStatus,
  voteSliderSticker,
  votePollSticker,
  replyQaSticker,
} = require("../controllers/statusController");

router.use(protect);

// ✅ Route with multer single file upload (field name: "media")
router.post("/", uploadSingle, createStatus);
router.get("/feed", getStatusFeed);
router.post("/:statusId/view", viewStatus);
router.post("/:statusId/reply", replyToStatus);
router.delete("/:statusId", deleteStatus);

// Interactive Sticker Interaction Routes
router.post("/:statusId/stickers/:stickerId/slider-vote", voteSliderSticker);
router.post("/:statusId/stickers/:stickerId/poll-vote", votePollSticker);
router.post("/:statusId/stickers/:stickerId/qa-reply", replyQaSticker);

module.exports = router;