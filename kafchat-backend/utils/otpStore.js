/**
 * MOCK OTP store — keeps OTPs in memory keyed by phone number.
 *
 * ⚠️ PRODUCTION NOTE:
 * Replace this with Redis (with TTL) so OTPs survive server restarts
 * and work across multiple Node instances. Also swap `sendSms()` in
 * authController.js with a real provider call (Twilio Verify / Firebase Auth).
 */

const otpMap = new Map(); // phoneNumber -> { otp, expiresAt, attempts }

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const setOtp = (phoneNumber) => {
  const otp = generateOtp();
  otpMap.set(phoneNumber, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return otp;
};

const verifyOtp = (phoneNumber, otp) => {
  const record = otpMap.get(phoneNumber);

  if (!record) return { valid: false, reason: "OTP not requested or already used" };
  if (Date.now() > record.expiresAt) {
    otpMap.delete(phoneNumber);
    return { valid: false, reason: "OTP expired" };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    otpMap.delete(phoneNumber);
    return { valid: false, reason: "Too many incorrect attempts. Request a new OTP" };
  }
  if (record.otp !== otp) {
    record.attempts += 1;
    return { valid: false, reason: "Incorrect OTP" };
  }

  otpMap.delete(phoneNumber); // one-time use
  return { valid: true };
};

module.exports = { setOtp, verifyOtp, generateOtp };
