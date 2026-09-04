const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getCallHistory,
  initiateCall,
  createRemoteControlSession,
  verifyRemoteControlPin,
  emergencyKillRemote,
} = require("../controllers/callController");

router.use(protect);

// Base Call History & Creation
router.get("/", getCallHistory);
router.post("/initiate", initiateCall);

// 🔒 Guarded Remote Control (PRO) Endpoints
router.post("/:callId/remote-pin", createRemoteControlSession);
router.post("/:callId/verify-remote-pin", verifyRemoteControlPin);
router.post("/:callId/kill-remote", emergencyKillRemote);

module.exports = router;