const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  generateQRToken,
  verifyQRLogin,
  checkQRStatus,
  terminateAllSecondarySessions,
  verifyDecoyPin,
} = require("../controllers/deviceController");

// Public QR Generation & Polling Endpoints
router.post("/qr-token", generateQRToken);
router.get("/qr-status/:qrToken", checkQRStatus);

// Protected Master Authority Actions
router.post("/verify-qr", protect, verifyQRLogin);
router.delete("/terminate-all", protect, terminateAllSecondarySessions);
router.post("/verify-decoy-pin", protect, verifyDecoyPin);

module.exports = router;