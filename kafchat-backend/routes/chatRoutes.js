const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  accessChat,
  accessPersonalVault,
  fetchChats,
  createGroup,
  acceptRequest,
  rejectRequest,
  clearChat,
  deleteConversation,
  updateGroupInfo,
  addMember,
  removeMember,
  toggleAdmin,
  setDisappearingTimer,
  togglePinChat,
  toggleFavoriteChat, // 👈 Added here
  toggleMute,
  toggleArchive,
  toggleLock,
  exitChatCleanup,
} = require("../controllers/chatController");

router.use(protect);

router.post("/access", accessChat);
router.post("/personal-vault", accessPersonalVault);
router.get("/", fetchChats);
router.post("/group", createGroup);

router.patch("/:chatId/accept", acceptRequest);
router.patch("/:chatId/reject", rejectRequest);

router.delete("/:chatId/clear", clearChat);
router.delete("/:chatId", deleteConversation);

router.patch("/group/update/:chatId", updateGroupInfo);
router.patch("/group/add", addMember);
router.patch("/group/remove", removeMember);
router.patch("/group/admin", toggleAdmin);

router.patch("/:chatId/disappearing", setDisappearingTimer);
router.post("/:chatId/exit-cleanup", exitChatCleanup);
router.patch("/:chatId/pin", togglePinChat);
router.patch("/:chatId/favorite", toggleFavoriteChat); // 👈 Added favorite route here
router.patch("/:chatId/mute", toggleMute);
router.patch("/:chatId/archive", toggleArchive);

router.post("/:chatId/toggle-lock", toggleLock);
router.patch("/:chatId/lock", toggleLock);

module.exports = router;