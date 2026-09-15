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
} = require("../controllers/userController");

router.use(protect);

// 1. Static & Named endpoints FIRST (Must be declared before dynamic :id)
router.get("/suggestions", getSuggestedUsers);
router.get("/search", searchUsers);
router.get("/username/:username", getUserByUsername);
router.get("/blocked", getBlockedUsers);
router.delete("/account", deleteAccount);
router.patch("/profile", updateProfile);

// Get logged-in user's own profile safely before /:id
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -lockPin -otp -otpExpires");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Close Friends & Story Privacy Routes
router.get("/close-friends", getCloseFriendsAndContacts);
router.post("/close-friends/:contactId/toggle", toggleCloseFriend);
router.post("/story-hide/:contactId/toggle", toggleStoryHide);

// 3. Dynamic ID & Network Sub-routes
router.get("/:id/network", getUserNetwork);
router.get("/:id/profile", getUserProfileWithPosts);
router.get("/:id", getUserById);
router.post("/:id/block", toggleBlockUser);

// 4. Base Fallback
router.get("/", searchUsers);

module.exports = router;