import api from "./api";

export const authService = {
  checkUsername: (username) => api.post("/auth/check-username", { username }),
  register: (payload) => api.post("/auth/register", payload),
  loginWithPassword: (payload) => api.post("/auth/login", payload),
  login: (payload) => api.post("/auth/login", payload),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),

  // Email OTP Handlers
  sendEmailOtp: (email) => api.post("/auth/send-email-otp", { email }),
  verifyEmailOtp: (payload) => api.post("/auth/verify-email-otp", payload),

  // Google Username Onboarding & Settings
  setGoogleUsername: (payload) => api.post("/auth/set-google-username", payload),
  updateUsername: (username) => api.patch("/auth/update-username", { username }),

  // Profile Photos
  uploadProfilePhoto: (photoUrl) => api.post("/auth/profile-photo", { photoUrl }),
  deleteProfilePhoto: (photoId) => api.delete(`/auth/profile-photo/${photoId}`),

  // Profile Details & Security
  updateProfile: (payload) => api.patch("/auth/profile", payload),
  changePassword: (payload) => api.patch("/auth/change-password", payload),
  setChatLockPin: (pin) => api.patch("/auth/chat-lock-pin", { pin }),

  // VIP PRO Activation
  activateVip: (plan, paymentId) => api.post("/auth/vip/activate", { plan, paymentId }),

  // Multi-Session Device Manager
  getSessions: () => api.get("/auth/sessions"),
  logoutSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  logoutAllOtherSessions: () => api.delete("/auth/sessions"),
};