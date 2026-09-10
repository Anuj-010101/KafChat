import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiLock,
  FiMail,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiKey,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import api from "../services/api";
import GoogleLoginBtn from "../components/GoogleLoginBtn";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const maxValidYear = currentYear - 13;
const minValidYear = 1920;
const YEARS = Array.from({ length: maxValidYear - minValidYear + 1 }, (_, i) => maxValidYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const AuthPage = () => {
  const { loginWithPassword, register, checkUsername, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme?.mode === "dark";

  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [signUpStep, setSignUpStep] = useState(1); // 1 = Verify Email, 2 = Choose Username, 3 = Details & Password

  // Google Multi-Account Selector Modal States
  const [googleModalData, setGoogleModalData] = useState(null); // { accounts, email, defaultAvatar, defaultName, credentialToken }
  const [isGoogleNewUserFlow, setIsGoogleNewUserFlow] = useState(false); // New user registration via Google email
  const [googleNewUsername, setGoogleNewUsername] = useState("");
  const [googleNewPassword, setGoogleNewPassword] = useState("");
  const [googleNewFullName, setGoogleNewFullName] = useState("");
  const [googleEmailVerified, setGoogleEmailVerified] = useState("");
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState("");

  // Sign In Field
  const [identifier, setIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Step 1 Verification Fields
  const [emailToVerify, setEmailToVerify] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);

  // Step 2 Username Validation
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle"); // "idle" | "checking" | "available" | "taken"
  const [usernameError, setUsernameError] = useState("");

  // Step 3 Profile Completion Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // Forgot Password Fields
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real-time Debounced Username Checker
  useEffect(() => {
    if (!usernameInput.trim() || signUpStep !== 2) {
      setUsernameStatus("idle");
      setUsernameError("");
      return;
    }

    if (usernameInput.trim().length < 3) {
      setUsernameStatus("taken");
      setUsernameError("Username must be at least 3 characters long");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername(usernameInput.trim());
        if (res.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError(res.message || "This username is already taken");
        }
      } catch {
        setUsernameStatus("taken");
        setUsernameError("Unable to check username availability");
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [usernameInput, signUpStep, checkUsername]);

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !signInPassword.trim()) {
      toast.error("Please enter your Username or Email and Password");
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword({ identifier: identifier.trim(), password: signInPassword });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // Google Login Response Handler (Triggers modal or direct login)
  const handleGoogleAuthResult = async (resData) => {
    if (resData?.hasExistingAccounts) {
      setGoogleModalData({
        accounts: resData.accounts,
        email: resData.email,
        defaultAvatar: resData.defaultAvatar,
        defaultName: resData.defaultName,
        credentialToken: resData.credentialToken,
      });
    } else if (resData?.isNewUser) {
      setGoogleEmailVerified(resData.email);
      setGoogleNewFullName(resData.defaultName || "");
      setGoogleAvatarUrl(resData.defaultAvatar || "");
      const base = resData.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      setGoogleNewUsername(`${base}_${Math.floor(100 + Math.random() * 900)}`);
      setIsGoogleNewUserFlow(true);
    } else if (resData?.token) {
      toast.success("Welcome back! 🎉");
    }
  };

  // Select existing account from Google modal
  const handleSelectGoogleAccount = async (targetUserId, credentialToken) => {
    setLoading(true);
    try {
      await loginWithGoogle(credentialToken, targetUserId);
      toast.success("Logged in successfully! 🎉");
      setGoogleModalData(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to login with selected account");
    } finally {
      setLoading(false);
    }
  };

  // Create new account using Google Email
  const handleGoogleNewAccountSubmit = async (e) => {
    e.preventDefault();
    if (!googleNewUsername.trim() || !googleNewPassword.trim()) {
      return toast.error("Username and Password are required");
    }
    if (googleNewPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await register({
        fullName: googleNewFullName.trim() || "KafChat User",
        username: googleNewUsername.trim().toLowerCase(),
        email: googleEmailVerified,
        password: googleNewPassword,
        avatar: googleAvatarUrl,
      });
      toast.success("Account created successfully! 🎉");
      setIsGoogleNewUserFlow(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Email OTP
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailToVerify.trim()) return toast.error("Enter a valid email address");

    setLoading(true);
    try {
      const res = await api.post("/auth/send-email-otp", {
        email: emailToVerify.trim(),
      });
      toast.success(res.data.message || "OTP sent to your email!");
      setIsEmailOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify Email OTP
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp.trim() || emailOtp.length !== 6) return toast.error("Enter valid 6-digit OTP");

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-email-otp", {
        email: emailToVerify.trim(),
        otp: emailOtp.trim(),
      });
      if (res.data.success) {
        toast.success("Email verified successfully! 🎉");
        setEmail(emailToVerify.trim());
        setSignUpStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Final Registration
  const handleFinalSignUp = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) return toast.error("Full Name is required");
    if (!password.trim() || password.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    let formattedDob = null;
    if (birthYear && birthMonth && birthDay) {
      const d = new Date(birthYear, birthMonth - 1, birthDay);
      if (
        d.getFullYear() !== Number(birthYear) ||
        d.getMonth() + 1 !== Number(birthMonth) ||
        d.getDate() !== Number(birthDay)
      ) {
        return toast.error("Invalid calendar date selected for DOB");
      }
      formattedDob = d.toISOString();
    }

    const fallbackDicebear = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(usernameInput.toLowerCase().trim())}`;

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        username: usernameInput.toLowerCase().trim(),
        email: email.trim(),
        password,
        gender: gender || "Prefer not to say",
        dob: formattedDob,
        avatar: fallbackDicebear,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      return toast.error("Please enter your registered Username or Email");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password-otp", {
        identifier: forgotIdentifier.trim(),
      });
      toast.success(res.data.message || "OTP sent to your email!");
      setTargetEmail(res.data.targetEmail);
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Account not found or no email linked.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 2
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim() || !newPassword.trim()) {
      return toast.error("OTP and New Password are required");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password-otp", {
        email: targetEmail,
        otp: resetOtp.trim(),
        newPassword,
      });
      toast.success(res.data.message || "Password changed! Please login.");
      setMode("signin");
      setForgotStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password. Check OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 select-none transition-colors duration-300 ${
        isDarkMode ? "bg-[#0b0e14] text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? "bg-cyan-500" : "bg-sky-400"}`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 ${isDarkMode ? "bg-pink-500" : "bg-purple-400"}`} />
      </div>

      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
          isDarkMode
            ? "bg-[#12151c]/95 border-slate-800 text-white shadow-cyan-500/5"
            : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50"
        }`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-pink-500 flex items-center justify-center shadow-lg text-white font-black text-xl">
              K
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              KafChat
            </h1>
          </div>
          <p className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            End-to-End Encrypted Messaging & Creative Space
          </p>
        </div>

        {/* Tab Switcher */}
        {mode !== "forgot" ? (
          <div className={`grid grid-cols-2 p-1 rounded-2xl mb-5 border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-100 border-slate-200"}`}>
            <button
              type="button"
              onClick={() => { setMode("signin"); setSignUpStep(1); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "signin"
                  ? "bg-cyan-400 text-slate-950 shadow-md font-black"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "signup"
                  ? "bg-cyan-400 text-slate-950 shadow-md font-black"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={() => { setMode("signin"); setForgotStep(1); }}
              className={`flex items-center gap-1.5 text-xs font-bold ${isDarkMode ? "text-cyan-400 hover:underline" : "text-sky-600 hover:underline"}`}
            >
              <FiArrowLeft size={14} /> Back to Sign In
            </button>
            <span className="text-xs font-bold text-slate-400">Password Recovery</span>
          </div>
        )}

        {/* 1. SIGN IN TAB */}
        {mode === "signin" && (
          <div>
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  Username or Email <span className="text-red-500">*</span>
                </label>
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800 focus-within:border-cyan-400" : "bg-slate-50 border-slate-300 focus-within:border-cyan-500"}`}>
                  <FiUser size={15} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="@username or email"
                    className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-950 placeholder:text-slate-400"}`}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className={`text-[11px] font-bold ${isDarkMode ? "text-cyan-400 hover:underline" : "text-sky-600 hover:underline"}`}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800 focus-within:border-cyan-400" : "bg-slate-50 border-slate-300 focus-within:border-cyan-500"}`}>
                  <FiLock size={15} className={isDarkMode ? "text-slate-400" : "text-slate-500"} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-950 placeholder:text-slate-400"}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}
                  >
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" /> : <><span>Sign In</span><FiArrowRight size={14} /></>}
              </button>
            </form>

            <div className="mt-4">
              <div className="flex items-center my-3">
                <div className={`flex-grow border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`} />
                <span className={`px-3 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>or continue with</span>
                <div className={`flex-grow border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`} />
              </div>
              <GoogleLoginBtn 
                onLoginSuccess={handleGoogleAuthResult} 
                onError={(msg) => toast.error(msg || "Google Sign-In failed")} 
              />
            </div>
          </div>
        )}

        {/* 2. MULTI-STEP SIGN UP WIZARD */}
        {mode === "signup" && (
          <div>
            <div className="flex items-center justify-between mb-5 px-2">
              <div className={`flex items-center gap-1.5 text-xs font-bold ${signUpStep >= 1 ? "text-cyan-400" : "text-slate-500"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signUpStep >= 1 ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400"}`}>1</span>
                <span>Verify Email</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${signUpStep >= 2 ? "bg-cyan-400" : "bg-slate-800"}`} />
              <div className={`flex items-center gap-1.5 text-xs font-bold ${signUpStep >= 2 ? "text-cyan-400" : "text-slate-500"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signUpStep >= 2 ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400"}`}>2</span>
                <span>Username</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${signUpStep >= 3 ? "bg-cyan-400" : "bg-slate-800"}`} />
              <div className={`flex items-center gap-1.5 text-xs font-bold ${signUpStep === 3 ? "text-cyan-400" : "text-slate-500"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signUpStep === 3 ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-400"}`}>3</span>
                <span>Profile</span>
              </div>
            </div>

            {/* STEP 1: VERIFY EMAIL */}
            {signUpStep === 1 && (
              <div className="flex flex-col gap-4">
                <p className={`text-xs text-center ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  To register, please verify your Email address.
                </p>

                {!isEmailOtpSent ? (
                  <form onSubmit={handleSendEmailOtp} className="flex flex-col gap-3">
                    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                      <FiMail size={15} className="text-slate-400" />
                      <input
                        type="email"
                        value={emailToVerify}
                        onChange={(e) => setEmailToVerify(e.target.value)}
                        placeholder="Enter your Email ID"
                        className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      {loading ? "Sending OTP..." : "Send Verification OTP to Email"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailOtp} className="flex flex-col gap-3">
                    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                      <FiKey size={15} className="text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className={`w-full bg-transparent text-xs text-center font-bold tracking-widest outline-none ${isDarkMode ? "text-white" : "text-slate-950"}`}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      {loading ? "Verifying..." : "Verify OTP & Continue"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: UNIQUE USERNAME SELECTION */}
            {signUpStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Choose a Unique Username <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border transition-all ${
                      usernameStatus === "available"
                        ? "border-green-500 bg-green-500/5"
                        : usernameStatus === "taken"
                        ? "border-red-500 bg-red-500/5 animate-shake"
                        : isDarkMode
                        ? "bg-[#1a1e29] border-slate-800"
                        : "bg-slate-50 border-slate-300"
                    }`}
                  >
                    <span className="text-slate-400 font-bold text-xs">@</span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                      placeholder="Full Name"
                      className={`w-full bg-transparent text-xs font-bold outline-none ${isDarkMode ? "text-white" : "text-slate-950"}`}
                      autoFocus
                    />
                    {usernameStatus === "checking" && <FiLoader size={16} className="animate-spin text-cyan-400" />}
                    {usernameStatus === "available" && <FiCheckCircle size={16} className="text-green-400" />}
                    {usernameStatus === "taken" && <FiAlertCircle size={16} className="text-red-500" />}
                  </div>

                  {usernameStatus === "available" && (
                    <p className="text-[11px] font-bold text-green-400 flex items-center gap-1 mt-0.5">
                      <FiCheckCircle size={12} /> Username is available!
                    </p>
                  )}
                  {usernameStatus === "taken" && (
                    <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                      <FiAlertCircle size={12} /> {usernameError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(1)}
                    className="w-1/3 py-2.5 rounded-2xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={usernameStatus !== "available"}
                    onClick={() => setSignUpStep(3)}
                    className="w-2/3 py-2.5 rounded-2xl bg-cyan-400 disabled:opacity-40 text-slate-950 font-black text-xs hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    <span>Next: Profile Details</span>
                    <FiArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: DETAILS & PASSWORD COMPLETION */}
            {signUpStep === 3 && (
              <form onSubmit={handleFinalSignUp} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                    <FiUser size={13} className="text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Email ID <span className="text-green-400 text-[10px]">(Verified)</span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border bg-cyan-500/10 border-cyan-500/30">
                    <FiMail size={13} className="text-cyan-400" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full bg-transparent text-xs outline-none font-medium text-cyan-300 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                      <FiLock size={13} className="text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                      <FiLock size={13} className="text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className={`text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`w-full px-3 py-2 rounded-2xl border text-xs outline-none cursor-pointer font-semibold ${isDarkMode ? "bg-[#1a1e29] border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-950"}`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={`text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Date of Birth</label>
                    <div className="grid grid-cols-3 gap-1">
                      <select
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value)}
                        className={`px-1 py-2 rounded-xl border text-xs outline-none font-semibold ${isDarkMode ? "bg-[#1a1e29] border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-950"}`}
                      >
                        <option value="">Day</option>
                        {DAYS.map((d) => (<option key={d} value={d}>{d}</option>))}
                      </select>
                      <select
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value)}
                        className={`px-1 py-2 rounded-xl border text-xs outline-none font-semibold ${isDarkMode ? "bg-[#1a1e29] border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-950"}`}
                      >
                        <option value="">Month</option>
                        {MONTHS.map((m, idx) => (<option key={m} value={idx + 1}>{m.slice(0, 3)}</option>))}
                      </select>
                      <select
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        className={`px-1 py-2 rounded-xl border text-xs outline-none font-semibold ${isDarkMode ? "bg-[#1a1e29] border-slate-800 text-white" : "bg-slate-50 border-slate-300 text-slate-950"}`}
                      >
                        <option value="">Year</option>
                        {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSignUpStep(2)}
                    className="w-1/3 py-3 rounded-2xl border border-slate-700 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 text-white font-black text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <span>Complete Registration 🎉</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 3. FORGOT PASSWORD FLOW */}
        {mode === "forgot" && (
          <div>
            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    Account Username or Email <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                    <FiUser size={15} className="text-slate-400" />
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="Enter registered username or email"
                      className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Send Recovery OTP to Email"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400">
                  OTP has been sent to your registered Email. Enter the 6-digit code below:
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>6-Digit OTP</label>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                    <FiKey size={15} className="text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className={`w-full bg-transparent text-xs font-bold tracking-widest outline-none ${isDarkMode ? "text-white" : "text-slate-950"}`}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>New Password</label>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                    <FiLock size={15} className="text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Confirm New Password</label>
                  <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}>
                    <FiLock size={15} className="text-slate-400" />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full bg-transparent text-xs outline-none font-medium ${isDarkMode ? "text-white" : "text-slate-950"}`}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  {loading ? "Resetting..." : "Reset Password & Login"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Security Badge */}
        <div className={`mt-5 pt-3.5 border-t flex items-center justify-center gap-4 text-[10px] font-medium ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
          <span className="flex items-center gap-1">
            <FiShield className="text-cyan-400" /> End-to-End Encrypted
          </span>
        </div>
      </div>

      {/* GOOGLE MULTI-ACCOUNT SELECTOR POPUP MODAL */}
      {googleModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode ? "bg-[#12151c] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <h3 className="text-lg font-black mb-2 text-center">Choose an Account</h3>
            <p className={`text-xs text-center mb-5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Multiple accounts are linked with <span className="font-bold text-cyan-400">{googleModalData.email}</span>. Select one to login or create a new account.
            </p>

            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto mb-4 pr-1">
              {googleModalData.accounts.map((acc) => (
                <div key={acc._id} className={`flex items-center justify-between p-3 rounded-2xl border ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-3">
                    <img 
                      src={acc.avatar || googleModalData.defaultAvatar || "https://api.dicebear.com/7.x/bottts/svg?seed=fallback"} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover border border-cyan-400/40" 
                    />
                    <div>
                      <h4 className="text-xs font-bold">{acc.fullName}</h4>
                      <p className="text-[11px] text-cyan-400">@{acc.username}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSelectGoogleAccount(acc._id, googleModalData.credentialToken)}
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs shadow hover:opacity-90 transition"
                  >
                    Login
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const email = googleModalData.email;
                  const name = googleModalData.defaultName;
                  const pic = googleModalData.defaultAvatar;
                  setGoogleModalData(null);
                  setGoogleEmailVerified(email);
                  setGoogleNewFullName(name || "");
                  setGoogleAvatarUrl(pic || "");
                  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                  setGoogleNewUsername(`${base}_${Math.floor(100 + Math.random() * 900)}`);
                  setIsGoogleNewUserFlow(true);
                }}
                className={`w-full py-2.5 rounded-2xl border text-xs font-bold transition ${isDarkMode ? "border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10" : "border-cyan-500 text-cyan-600 hover:bg-cyan-50"}`}
              >
                + Create New Account with this Email
              </button>
              <button
                type="button"
                onClick={() => setGoogleModalData(null)}
                className="w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE NEW USER ONBOARDING MODAL */}
      {isGoogleNewUserFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDarkMode ? "bg-[#12151c] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"}`}>
            <h3 className="text-lg font-black mb-1 text-center">Complete Your Profile</h3>
            <p className={`text-xs text-center mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Set your username and password for <span className="font-bold text-cyan-400">{googleEmailVerified}</span>
            </p>

            <form onSubmit={handleGoogleNewAccountSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">Full Name</label>
                <input
                  type="text"
                  value={googleNewFullName}
                  onChange={(e) => setGoogleNewFullName(e.target.value)}
                  className={`px-3 py-2.5 rounded-2xl border text-xs outline-none ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">Username</label>
                <input
                  type="text"
                  value={googleNewUsername}
                  onChange={(e) => setGoogleNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                  className={`px-3 py-2.5 rounded-2xl border text-xs outline-none ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">Password (for future manual login)</label>
                <input
                  type="password"
                  value={googleNewPassword}
                  onChange={(e) => setGoogleNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`px-3 py-2.5 rounded-2xl border text-xs outline-none ${isDarkMode ? "bg-[#1a1e29] border-slate-800" : "bg-slate-50 border-slate-300"}`}
                  required
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleNewUserFlow(false)}
                  className="w-1/3 py-2.5 rounded-2xl border border-slate-700 text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-2xl bg-cyan-400 text-slate-950 font-black text-xs hover:opacity-95 transition"
                >
                  {loading ? "Creating..." : "Create Account & Login 🎉"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;