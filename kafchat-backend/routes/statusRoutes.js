const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createStatus,
  getStatusFeed,
  viewStatus,
  replyToStatus,
  deleteStatus,
} = require("../controllers/statusController");

router.use(protect);

router.post("/", createStatus);
router.get("/", getStatusFeed);
router.post("/:statusId/view", viewStatus);
router.post("/:statusId/reply", replyToStatus);
router.delete("/:statusId", deleteStatus);

module.exports = router;