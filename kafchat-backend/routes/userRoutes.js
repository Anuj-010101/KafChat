const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");

const {
  searchUsers,
  getUserById,
  getUserByUsername,
  updateProfile,
  toggleBlockUser,
  getBlockedUsers,
  getSuggestedUsers,
  deleteAccount,
  getCloseFriendsAndContacts,
  toggleCloseFriend,
  toggleStoryHide,
  getUserNetwork,
  getUserProfileWithPosts,
  unfollowUser,
  followUser, // ✅ Yeh yahan zaroor hona chahiye
} = require("../controllers/userController");

router.use(protect);

router.get("/suggestions", getSuggestedUsers);
router.get("/search", searchUsers);
router.get("/username/:username", getUserByUsername);
router.get("/blocked", getBlockedUsers);
router.delete("/account", deleteAccount);
router.patch("/profile", updateProfile);

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -lockPin -otp -otpExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/close-friends", getCloseFriendsAndContacts);
router.post("/close-friends/:contactId/toggle", toggleCloseFriend);
router.post("/story-hide/:contactId/toggle", toggleStoryHide);
router.patch("/unfollow/:id", unfollowUser);
router.post("/follow/:id", followUser);

router.get("/:id/network", getUserNetwork);
router.get("/:id/profile", getUserProfileWithPosts);
router.get("/:id", getUserById);
router.post("/:id/block", toggleBlockUser);

router.get("/", searchUsers);

module.exports = router;