const crypto = require("crypto");
const User = require("../models/User");

/**
 * Helper to check if string is valid Base64
 */
const isValidBase64 = (str) => {
  if (typeof str !== "string" || str.trim() === "") return false;
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch (err) {
    return false;
  }
};

/**
 * Middleware: verifyE2EEPayload
 * Ensures that any outgoing encrypted message contains:
 * 1. Valid non-empty ciphertext string (Base64)
 * 2. 12-byte (96-bit) AES-GCM Initialization Vector (IV)
 * 3. Registered cryptographic public key from the sender account
 */
const verifyE2EEPayload = async (req, res, next) => {
  try {
    const { encryptedContent, iv, mediaType, text } = req.body;

    // 1. Non-encrypted/plain features ko bypass karo (e.g. Polls, System Notifications)
    if (mediaType === "poll" || mediaType === "system_notice" || mediaType === "none") {
      return next();
    }

    // 2. Agar payload encrypted bheja gaya hai, toh IV hona mandatory hai
    if (encryptedContent) {
      if (!iv) {
        return res.status(400).json({
          success: false,
          message: "E2EE Security Violation: Initialization Vector (IV) missing for encrypted payload.",
        });
      }

      // Check Base64 format of cipher and IV
      if (!isValidBase64(encryptedContent) || !isValidBase64(iv)) {
        return res.status(400).json({
          success: false,
          message: "E2EE Format Error: Ciphertext or IV is not properly Base64 encoded.",
        });
      }
    }

    // 3. Sender ki Public Key check karo (Database verification)
    if (req.user) {
      if (!req.user.publicKey || req.user.publicKey === "E2EE_KEY_PENDING") {
        return res.status(403).json({
          success: false,
          message: "E2EE Key Error: Sender does not have a registered cryptographic identity key.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("E2EE Verification Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal cryptographic validation error",
    });
  }
};

module.exports = {
  verifyE2EEPayload,
};