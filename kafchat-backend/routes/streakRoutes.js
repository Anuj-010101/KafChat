const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadSingle } = require("../middleware/uploadMiddleware");

const {
  sendSnap,
  saveSnapToVault,
  restoreStreak,
  getStreakDetails,
} = require("../controllers/streakController");

router.use(protect);

// 1. Send / Exchange Snap
router.post("/send", uploadSingle, sendSnap);

// 2. Dedicated Saved Snaps Vault
router.post("/:streakId/save-snap", saveSnapToVault);

// 3. Restore Broken Streak (Free: 3 times, VIP PRO: 5 times)
router.post("/:streakId/restore", restoreStreak);

// 4. Fetch Streak & Snap Vault by Partner ID
router.get("/:partnerId", getStreakDetails);

module.exports = router;