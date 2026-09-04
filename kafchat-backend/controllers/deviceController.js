const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Active QR Tokens Storage (1-Minute In-Memory Expiry)
const dynamicQRCodes = new Map();

// @desc Generate Dynamic QR Code Token for Multi-Link Scan
// @route POST /api/devices/qr-token
exports.generateQRToken = async (req, res) => {
  try {
    const qrToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 1000; // 60 seconds dynamic refresh

    dynamicQRCodes.set(qrToken, { expiresAt, scannedBy: null, verified: false });

    return res.status(200).json({
      success: true,
      qrToken,
      expiresInSec: 60,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Authorize Secondary Device via Master Phone QR Scan
// @route POST /api/devices/verify-qr
exports.verifyQRLogin = async (req, res) => {
  try {
    const { qrToken, secondaryDeviceModel } = req.body;
    const masterUser = req.user;

    if (!qrToken || !dynamicQRCodes.has(qrToken)) {
      return res.status(400).json({ success: false, message: "QR token expired or invalid." });
    }

    const qrData = dynamicQRCodes.get(qrToken);
    if (Date.now() > qrData.expiresAt) {
      dynamicQRCodes.delete(qrToken);
      return res.status(400).json({ success: false, message: "QR code expired. Generate a new one." });
    }

    // Limit check for Free tier (Max 4 Linked Devices for Free / Unlimited for PRO)
    const maxDevicesAllowed = masterUser.isVIP ? 100 : 4;
    const currentSessions = masterUser.sessions || [];

    if (currentSessions.length >= maxDevicesAllowed) {
      return res.status(403).json({
        success: false,
        message: `Device limit reached (${maxDevicesAllowed} devices max). Upgrade to VIP PRO for unlimited linked devices.`,
      });
    }

    const secondarySessionId = crypto.randomBytes(16).toString("hex");
    const newSession = {
      sessionId: secondarySessionId,
      deviceId: `device_${Date.now()}`,
      deviceName: secondaryDeviceModel || "Secondary Linked Device",
      browser: "Linked Client",
      os: "Desktop/Web",
      ip: req.ip || "",
      isRoot: false,
      lastActive: new Date(),
    };

    masterUser.sessions.push(newSession);
    await masterUser.save();

    const secondaryJwt = jwt.sign(
      { id: masterUser._id, sessionId: secondarySessionId },
      process.env.JWT_SECRET || "kafchat_master_secret",
      { expiresIn: "30d" }
    );

    qrData.verified = true;
    qrData.authToken = secondaryJwt;
    qrData.userData = masterUser;
    dynamicQRCodes.set(qrToken, qrData);

    return res.status(200).json({
      success: true,
      message: "Device successfully authorized by Master Root Device.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Poll QR Token Status (Client waiting for scan)
// @route GET /api/devices/qr-status/:qrToken
exports.checkQRStatus = async (req, res) => {
  try {
    const { qrToken } = req.params;
    if (!dynamicQRCodes.has(qrToken)) {
      return res.status(400).json({ success: false, message: "Invalid QR Token" });
    }

    const qrData = dynamicQRCodes.get(qrToken);
    if (Date.now() > qrData.expiresAt) {
      dynamicQRCodes.delete(qrToken);
      return res.status(400).json({ success: false, message: "QR Code Expired" });
    }

    if (qrData.verified && qrData.authToken) {
      dynamicQRCodes.delete(qrToken);
      return res.status(200).json({
        success: true,
        authenticated: true,
        token: qrData.authToken,
        user: qrData.userData,
      });
    }

    return res.status(200).json({ success: true, authenticated: false });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Master 1-Tap Remote Force Logout for All Secondary Sessions
// @route DELETE /api/devices/terminate-all
exports.terminateAllSecondarySessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const rootSession = user.sessions.find((s) => s.isRoot) || user.sessions[0];

    // Keep only the Master root session
    user.sessions = rootSession ? [rootSession] : [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "All secondary linked devices logged out instantly.",
      activeSessions: user.sessions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Decoy Fake Calculator App PIN Unlock
// @route POST /api/devices/verify-decoy-pin
exports.verifyDecoyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.lockPin) {
      return res.status(400).json({ success: false, message: "No Decoy PIN configured." });
    }

    if (user.lockPin !== pin) {
      return res.status(401).json({ success: false, message: "Decoy calculation completed (Incorrect PIN)." });
    }

    return res.status(200).json({
      success: true,
      unlocked: true,
      message: "Decoy PIN verified. Launching KafChat Core Suite.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};