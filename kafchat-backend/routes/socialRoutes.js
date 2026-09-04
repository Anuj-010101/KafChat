const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

const {
  getActivityFeed,
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  markActivityAsRead,
  createStory,
  getStories,
  getStoryArchive,
  createPost,
  toggleLikePost,
  getReelsFeed,
  getUserPosts,
} = require("../controllers/socialController");

router.use(protect);

// 1. Follow & Unfollow Action (Public direct follow / Private pending request)
router.post("/follow/:userId", sendFollowRequest);

// 2. Activity Drawer & Follow Request Confirm / Reject
router.get("/activity", getActivityFeed);
router.patch("/activity/read", markActivityAsRead);
router.post("/follow-request/:id/accept", acceptFollowRequest);
router.post("/follow-request/:id/reject", rejectFollowRequest);

// 3. Stories Studio (24h Window)
router.post("/stories", uploadSingle, createStory);
router.get("/stories", getStories);
router.get("/stories/archive", getStoryArchive);

// 4. Posts & Reels Feed Engine
router.post("/posts", uploadSingle, createPost);
router.post("/posts/:postId/like", toggleLikePost);
router.get("/reels", getReelsFeed);
router.get("/user/:userId/posts", getUserPosts);

module.exports = router;