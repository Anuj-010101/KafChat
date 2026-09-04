const express = require("express");
const router = express.Router();
const { getSongs, addSong } = require("../controllers/songController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/songs -> Fetch all songs with optional search
router.get("/", protect, getSongs);

// POST /api/songs -> Add new song
router.post("/", protect, addSong);

module.exports = router;