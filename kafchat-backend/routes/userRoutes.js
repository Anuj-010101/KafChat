const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

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