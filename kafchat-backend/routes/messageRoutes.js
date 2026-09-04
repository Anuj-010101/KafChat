const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadMultiple } = require("../middleware/uploadMiddleware");

const {
  getMessages,
  sendMessage,
  uploadBatchFiles,
  cleanupSnapMessages,
  markAsRead,
  votePoll,
  togglePin,
  getPinnedMessages,
  editMessage,
  deleteMessage,
  clearChat,
  reactToMessage,
  searchMessages,
} = require("../controllers/messageController");

// Base & Batch Upload Routes
router.get("/:chatId", protect, getMessages);
router.post("/", protect, sendMessage);
router.post("/upload-batch", protect, uploadMultiple, uploadBatchFiles);
router.post("/cleanup-snap/:chatId", protect, cleanupSnapMessages);

// Actions, Pinned & Reactions
router.patch("/read/:chatId", protect, markAsRead);
router.patch("/:messageId/vote", protect, votePoll);
router.patch("/:messageId/pin", protect, togglePin);
router.get("/:chatId/pinned", protect, getPinnedMessages);
router.patch("/:messageId", protect, editMessage);
router.delete("/:messageId", protect, deleteMessage);
router.delete("/clear/:chatId", protect, clearChat);
router.post("/:messageId/react", protect, reactToMessage);
router.get("/:chatId/search", protect, searchMessages);

module.exports = router;