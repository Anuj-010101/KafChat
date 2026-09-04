import React, { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../config/firebase";
import { FiSmartphone, FiKey, FiX, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";

const PhoneOtpModal = ({ isOpen, onClose, onVerified }) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Input
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  const cleanupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        console.warn("Recaptcha clear error:", e);
      }
      recaptchaVerifierRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    cleanupRecaptcha();
    setStep(1);
    setPhone("");
    setOtp("");
    setLoading(false);
    onClose();
  };

  const getOrCreateVerifier = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const container = document.getElementById("firebase-recaptcha-anchor");
    if (!container) return null;

    const verifier = new RecaptchaVerifier(auth, "firebase-recaptcha-anchor", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        toast.error("Security verification expired. Please retry.");
        cleanupRecaptcha();
      },
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  // 1. Send SMS OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const cleanNumber = phone.replace(/\D/g, "").slice(-10);
    if (cleanNumber.length !== 10) {
      return toast.error("Please enter a valid 10-digit mobile number");
    }

    setLoading(true);
    const fullPhone = `+91${cleanNumber}`;

    try {
      cleanupRecaptcha();
      const verifier = getOrCreateVerifier();
      if (!verifier) {
        throw new Error("Verification container not ready. Please retry.");
      }

      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(confirmation);
      setStep(2);
      toast.success(`OTP sent to ${fullPhone}`);
    } catch (error) {
      console.error("SMS Send Error:", error);
      cleanupRecaptcha();
      toast.error(error.message || "Failed to send SMS OTP. Please check phone number.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      return toast.error("Enter a valid 6-digit OTP");
    }

    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("Session expired. Please request OTP again.");
      }

      await confirmationResult.confirm(otp.trim());
      toast.success("Phone verified successfully! 🎉");
      
      const verifiedCleanPhone = phone.replace(/\D/g, "").slice(-10);
      handleClose();
      onVerified(verifiedCleanPhone);
    } catch (error) {
      console.error("OTP Verify Error:", error);
      toast.error("Incorrect or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Persistent Invisible reCAPTCHA Anchor */}
      <div id="firebase-recaptcha-anchor"></div>

      <div className="relative w-full max-w-sm p-6 bg-[#0d131f] border border-slate-800 rounded-3xl text-white shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <FiX size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            {step === 1 ? <FiSmartphone size={16} /> : <FiKey size={16} />}
          </div>
          <h3 className="text-base font-black text-transparent bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text">
            {step === 1 ? "Mobile Verification" : "Enter Verification Code"}
          </h3>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          {step === 1
            ? "Enter your 10-digit mobile number to receive a 6-digit OTP."
            : `6-digit code sent to +91 ${phone.slice(-10)}`}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#121929] border border-slate-800 focus-within:border-cyan-400">
              <span className="text-xs font-bold text-slate-400">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-transparent text-xs outline-none font-medium text-white placeholder:text-slate-500"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  <span>Verifying & Sending...</span>
                </>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#121929] border border-slate-800 focus-within:border-cyan-400">
              <FiKey size={14} className="text-slate-400" />
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                className="w-full bg-transparent text-xs font-bold tracking-widest outline-none text-white text-center placeholder:text-slate-500"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 text-white font-black text-xs hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" size={14} />
                  <span>Verifying Code...</span>
                </>
              ) : (
                "Verify OTP & Continue"
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-bold text-slate-400 hover:text-cyan-400 text-center mt-1"
            >
              Change Mobile Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneOtpModal;