const express = require("express");
const router = express.Router();
const {
  checkUsernameAvailability,
  register,
  loginWithPassword,
  googleAuth,
  sendEmailOtp,
  verifyEmailOtp,
  getLinkedAccounts,
  switchAccount,
  deleteAccount,
  uploadProfilePhoto,
  deleteProfilePhoto,
  changePassword,
  updateProfile,
  setChatLockPin,
  resetChatLockPin,
  getMe,
  logout,
  getSessions,
  logoutSession,
  logoutAllOtherSessions,
  sendForgotPasswordOtp,
  verifyResetOtp,     // 👈 Added import
  resetPasswordWithOtp,
  activateVipPlan,
  setGoogleUsername,
  updateUsername,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public Endpoints
router.post("/check-username", checkUsernameAvailability);
router.post("/google", googleAuth);
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/register", register);
router.post("/complete-registration", register);
router.post("/login", loginWithPassword);
router.post("/login-with-password", loginWithPassword);
router.post("/forgot-password-otp", sendForgotPasswordOtp);
router.post("/verify-reset-otp", verifyResetOtp);     // 👈 Added route
router.post("/reset-password-otp", resetPasswordWithOtp);
router.post("/set-google-username", setGoogleUsername);

// Protected Auth Endpoints
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.get("/linked-accounts", protect, getLinkedAccounts);
router.post("/switch-account", protect, switchAccount);
router.delete("/delete-account/:userId?", protect, deleteAccount);
router.patch("/profile", protect, updateProfile);
router.patch("/change-password", protect, changePassword);
router.patch("/chat-lock-pin", protect, setChatLockPin);
router.post("/reset-chat-lock-pin", protect, resetChatLockPin);
router.patch("/update-username", protect, updateUsername);

// VIP Activation Route
router.post("/vip/activate", protect, activateVipPlan);

// DP Management
router.post("/profile-photo", protect, uploadProfilePhoto);
router.delete("/profile-photo/:photoId", protect, deleteProfilePhoto);

// Sessions
router.get("/sessions", protect, getSessions);
router.delete("/sessions/:sessionId", protect, logoutSession);
router.delete("/sessions", protect, logoutAllOtherSessions);

module.exports = router;