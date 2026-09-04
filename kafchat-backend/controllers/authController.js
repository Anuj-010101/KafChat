const { OAuth2Client } = require("google-auth-library");
const { sendOtpEmail } = require("../utils/sendEmail");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const parseUserAgent = (uaString = "") => {
  let browser = "Browser";
  let os = "Device";

  if (/chrome|crios/i.test(uaString)) browser = "Chrome";
  else if (/firefox|fxios/i.test(uaString)) browser = "Firefox";
  else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) browser = "Safari";
  else if (/edg/i.test(uaString)) browser = "Edge";

  if (/windows/i.test(uaString)) os = "Windows PC";
  else if (/macintosh|mac os x/i.test(uaString)) os = "Mac";
  else if (/android/i.test(uaString)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(uaString)) os = "iOS Device";
  else if (/linux/i.test(uaString)) os = "Linux PC";

  return { browser, os, deviceName: `${browser} on ${os}` };
};

const generateToken = (id, sessionId) => {
  return jwt.sign({ id, sessionId }, process.env.JWT_SECRET || "kafchat_master_secret", {
    expiresIn: "30d",
  });
};

// @desc Check Username Realtime Availability
// @route POST /api/auth/check-username
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, available: false, message: "Username required" });
    }

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_.]/g, "").trim();

    if (cleanUsername.length < 3) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Username must be at least 3 characters",
      });
    }

    const exists = await User.findOne({ username: cleanUsername });

    return res.status(200).json({
      success: true,
      available: !exists,
      username: cleanUsername,
      message: exists ? "This username is already taken" : "Username is available!",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Google 1-Click Auth
// @route POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { token, deviceId } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Google token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    const cleanEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: cleanEmail });

    const sessionId = crypto.randomBytes(16).toString("hex");
    const { browser, os, deviceName } = parseUserAgent(req.headers["user-agent"]);

    if (!user) {
      const baseUsername = cleanEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const uniqueUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;

      user = await User.create({
        fullName: name || "KafChat User",
        username: uniqueUsername,
        email: cleanEmail,
        phoneNumber: "",
        phone: "",
        password: crypto.randomBytes(16).toString("hex"),
        avatar: picture || "",
        profilePhotos: picture ? [{ url: picture, uploadedAt: new Date() }] : [],
        isEmailVerified: true,
        isPhoneVerified: false,
        rootDeviceId: deviceId || sessionId,
        sessions: [
          {
            sessionId,
            deviceId: deviceId || sessionId,
            deviceName,
            browser,
            os,
            ip: req.ip || "",
            isRoot: true,
            lastActive: new Date(),
          },
        ],
      });
    } else {
      if (!user.sessions) user.sessions = [];
      if (user.sessions.length >= 10) user.sessions.shift();

      user.sessions.push({
        sessionId,
        deviceId: deviceId || sessionId,
        deviceName,
        browser,
        os,
        ip: req.ip || "",
        isRoot: deviceId === user.rootDeviceId,
        lastActive: new Date(),
      });

      user.isOnline = true;
      user.loginCount = (user.loginCount || 0) + 1;
      user.lastLoginAt = new Date();
      await user.save();
    }

    const appToken = generateToken(user._id, sessionId);

    return res.status(200).json({
      success: true,
      token: appToken,
      sessionId,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatar: user.avatar,
        avatarConfig: user.avatarConfig,
        profilePhotos: user.profilePhotos,
        avatarBitmojiFallback: user.avatarBitmojiFallback,
        bio: user.bio,
        gender: user.gender,
        isVIP: user.isVIP,
        hdUploadEnabled: user.hdUploadEnabled,
        streakRecoveriesLeft: user.streakRecoveriesLeft,
        streakPerks: user.streakPerks,
        publicKey: user.publicKey,
        lockPin: user.lockPin,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(400).json({ success: false, message: "Google verification failed" });
  }
};

// @desc Send Email OTP
// @route POST /api/auth/send-email-otp
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const baseUsername = cleanEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      user = new User({
        email: cleanEmail,
        username: `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`,
        fullName: baseUsername,
        phoneNumber: "",
        phone: "",
        password: crypto.randomBytes(16).toString("hex"),
      });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    if (typeof sendOtpEmail === "function") {
      await sendOtpEmail(cleanEmail, otp).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanEmail}`,
    });
  } catch (error) {
    console.error("Send Email OTP Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email OTP" });
  }
};

// @desc Verify Email OTP
// @route POST /api/auth/verify-email-otp
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp, deviceId } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or incorrect OTP" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    user.otp = null;
    user.otpExpires = null;
    user.isEmailVerified = true;
    user.isOnline = true;
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();

    const sessionId = crypto.randomBytes(16).toString("hex");
    const { browser, os, deviceName } = parseUserAgent(req.headers["user-agent"]);

    if (!user.sessions) user.sessions = [];
    user.sessions.push({
      sessionId,
      deviceId: deviceId || sessionId,
      deviceName,
      browser,
      os,
      ip: req.ip || "",
      isRoot: deviceId === user.rootDeviceId,
      lastActive: new Date(),
    });

    await user.save();

    const token = generateToken(user._id, sessionId);

    const linkedAccounts = await User.find({ email: cleanEmail }).select(
      "fullName username email phoneNumber avatar profilePhotos isVIP lockPin"
    );

    return res.status(200).json({
      success: true,
      user,
      token,
      sessionId,
      linkedAccounts,
      isNewUser: !user.password,
      message: "Email OTP verified successfully!",
    });
  } catch (error) {
    console.error("Verify Email OTP Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Pre-check phone accounts
// @route POST /api/auth/check-phone
exports.checkPhoneAccounts = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: "Phone number is required" });

    const cleanNumber = phoneNumber.toString().replace(/\D/g, "").slice(-10);
    const existingAccounts = await User.find({
      $or: [{ phoneNumber: cleanNumber }, { phone: cleanNumber }],
    }).select("username fullName profilePhotos avatar avatarConfig avatarBitmojiFallback isVIP email lockPin");

    return res.status(200).json({
      success: true,
      accountCount: existingAccounts.length,
      requiresEmail: existingAccounts.length >= 1,
      accounts: existingAccounts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Register Profile
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      username,
      phoneNumber,
      phone,
      email,
      password,
      publicKey,
      rootDeviceId,
      avatar,
      avatarConfig,
      gender,
      dob,
    } = req.body;

    const rawPhone = phoneNumber || phone || "";
    const cleanPhone = rawPhone ? rawPhone.toString().replace(/\D/g, "").slice(-10) : "";
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;

    if (!fullName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Username, and Password are required.",
      });
    }

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Either Mobile Number or Email is required.",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    const usernameExists = await User.findOne({ username: cleanUsername });
    if (usernameExists) {
      return res.status(400).json({ success: false, message: "This username is already taken." });
    }

    if (cleanPhone) {
      const existingOnPhone = await User.find({
        $or: [{ phoneNumber: cleanPhone }, { phone: cleanPhone }],
      });

      if (existingOnPhone.length >= 1 && !cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email ID is mandatory when creating more than one account on the same phone number.",
        });
      }
    }

    if (cleanEmail) {
      const emailExists = await User.findOne({ email: cleanEmail });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "This email is already linked to another profile." });
      }
    }

    const sessionId = crypto.randomBytes(16).toString("hex");
    const { browser, os, deviceName } = parseUserAgent(req.headers["user-agent"]);

    const defaultAvatarConfig = {
      gender: gender === "Female" ? "female" : "male",
      skinColor: gender === "Female" ? "#fcd7b8" : "#f5d0b5",
      hairStyle: gender === "Female" ? "long-waves" : "short-fade",
      hairColor: gender === "Female" ? "#451a03" : "#1e293b",
      topStyle: gender === "Female" ? "jacket" : "hoodie",
      topColor: gender === "Female" ? "#db2777" : "#0284c7",
      pantStyle: "jeans",
      pantColor: "#1e293b",
      shoesStyle: "sneakers",
      shoesColor: "#f8fafc",
      handPose: gender === "Female" ? "peace" : "wave",
      expression: "smile",
      glasses: "none",
      bgTheme: gender === "Female" ? "neon" : "sunset",
    };

    const initialPhotos = avatar ? [{ url: avatar, uploadedAt: new Date() }] : [];

    const newUserData = {
      fullName: fullName.trim(),
      username: cleanUsername,
      phoneNumber: cleanPhone,
      phone: cleanPhone,
      password,
      dob: dob || null,
      publicKey: publicKey || "",
      rootDeviceId: rootDeviceId || sessionId,
      avatar: avatar || "",
      avatarConfig: avatarConfig || defaultAvatarConfig,
      profilePhotos: initialPhotos,
      gender: gender || "Prefer not to say",
      isPhoneVerified: Boolean(cleanPhone),
      isEmailVerified: Boolean(cleanEmail),
      streakRecoveriesLeft: 3,
      sessions: [
        {
          sessionId,
          deviceId: rootDeviceId || sessionId,
          deviceName,
          browser,
          os,
          ip: req.ip || "",
          isRoot: true,
          lastActive: new Date(),
        },
      ],
    };

    if (cleanEmail) {
      newUserData.email = cleanEmail;
    }

    const user = await User.create(newUserData);
    const token = generateToken(user._id, sessionId);

    return res.status(201).json({
      success: true,
      token,
      sessionId,
      message: "Account registered successfully!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatar: user.avatar,
        avatarConfig: user.avatarConfig,
        profilePhotos: user.profilePhotos,
        avatarBitmojiFallback: user.avatarBitmojiFallback,
        bio: user.bio,
        gender: user.gender,
        isVIP: user.isVIP,
        hdUploadEnabled: user.hdUploadEnabled,
        streakRecoveriesLeft: user.streakRecoveriesLeft,
        streakPerks: user.streakPerks,
        publicKey: user.publicKey,
        lockPin: user.lockPin,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Registration failed" });
  }
};

// @desc Password Login
// @route POST /api/auth/login
exports.loginWithPassword = async (req, res) => {
  try {
    const rawInput =
      req.body.identifier ||
      req.body.phoneNumber ||
      req.body.emailOrUsername ||
      req.body.username ||
      req.body.email ||
      req.body.phone;

    const rawPassword = req.body.password;
    const clientDeviceId = req.body.deviceId;

    if (!rawInput || !rawPassword) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username/mobile/email and password",
      });
    }

    const input = rawInput.toString().trim();
    const cleanUsername = input.replace(/^@/, "").trim().toLowerCase();
    const digitsOnly = input.replace(/\D/g, "");

    const conditions = [
      { username: cleanUsername },
      { username: input.toLowerCase() },
      { email: input.toLowerCase() },
      { phone: input },
      { phoneNumber: input },
    ];

    if (digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10);
      conditions.push({ phone: last10 });
      conditions.push({ phoneNumber: last10 });
    }

    const user = await User.findOne({ $or: conditions }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. User not found.",
      });
    }

    const isMatch = await user.matchPassword(rawPassword.toString().trim());

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Password incorrect.",
      });
    }

    const sessionId = crypto.randomBytes(16).toString("hex");
    const safeDeviceId = clientDeviceId || user.rootDeviceId || sessionId;
    const { browser, os, deviceName } = parseUserAgent(req.headers["user-agent"]);

    if (!user.sessions) user.sessions = [];
    if (user.sessions.length >= 10) user.sessions.shift();

    user.sessions.push({
      sessionId,
      deviceId: safeDeviceId,
      deviceName,
      browser,
      os,
      ip: req.ip || "",
      isRoot: safeDeviceId === user.rootDeviceId,
      lastActive: new Date(),
    });

    user.isOnline = true;
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, sessionId);

    return res.status(200).json({
      success: true,
      token,
      sessionId,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatar: user.avatar,
        avatarConfig: user.avatarConfig,
        profilePhotos: user.profilePhotos,
        avatarBitmojiFallback: user.avatarBitmojiFallback,
        bio: user.bio,
        gender: user.gender,
        isVIP: user.isVIP,
        hdUploadEnabled: user.hdUploadEnabled,
        streakRecoveriesLeft: user.streakRecoveriesLeft,
        streakPerks: user.streakPerks,
        publicKey: user.publicKey,
        lockPin: user.lockPin,
      },
    });
  } catch (error) {
    console.error("loginWithPassword error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get All Linked Accounts
// @route GET /api/auth/linked-accounts
exports.getLinkedAccounts = async (req, res) => {
  try {
    const currentEmail = req.user.email;
    const currentPhone = req.user.phoneNumber || req.user.phone;

    const queryConditions = [];
    if (currentPhone) {
      queryConditions.push({ phoneNumber: currentPhone });
      queryConditions.push({ phone: currentPhone });
    }
    if (currentEmail) {
      queryConditions.push({ email: currentEmail });
    }

    const accounts = await User.find({ $or: queryConditions }).select(
      "fullName username email phoneNumber avatar profilePhotos isVIP streakRecoveriesLeft lockPin"
    );

    return res.status(200).json({ success: true, accounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Fast 1-Tap Account Switch
// @route POST /api/auth/switch-account
exports.switchAccount = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target profile not found" });
    }

    const currentPhone = req.user.phoneNumber || req.user.phone;
    const currentEmail = req.user.email;

    const isAuthorized =
      (targetUser.phoneNumber && targetUser.phoneNumber === currentPhone) ||
      (targetUser.phone && targetUser.phone === currentPhone) ||
      (currentEmail && targetUser.email === currentEmail);

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Unauthorized profile switch" });
    }

    const sessionId = crypto.randomBytes(16).toString("hex");
    const { browser, os, deviceName } = parseUserAgent(req.headers["user-agent"]);

    if (!targetUser.sessions) targetUser.sessions = [];
    targetUser.sessions.push({
      sessionId,
      deviceId: sessionId,
      deviceName,
      browser,
      os,
      ip: req.ip || "",
      isRoot: false,
      lastActive: new Date(),
    });
    await targetUser.save();

    const token = generateToken(targetUser._id, sessionId);

    return res.status(200).json({
      success: true,
      token,
      sessionId,
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        username: targetUser.username,
        phoneNumber: targetUser.phoneNumber,
        email: targetUser.email,
        avatar: targetUser.avatar,
        avatarConfig: targetUser.avatarConfig,
        profilePhotos: targetUser.profilePhotos,
        avatarBitmojiFallback: targetUser.avatarBitmojiFallback,
        bio: targetUser.bio,
        gender: targetUser.gender,
        isVIP: targetUser.isVIP,
        hdUploadEnabled: targetUser.hdUploadEnabled,
        streakRecoveriesLeft: targetUser.streakRecoveriesLeft,
        streakPerks: targetUser.streakPerks,
        publicKey: targetUser.publicKey,
        lockPin: targetUser.lockPin,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete Specific Account / Handle
// @route DELETE /api/auth/delete-account/:userId
exports.deleteAccount = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;
    const currentPhone = req.user.phoneNumber || req.user.phone;
    const currentEmail = req.user.email;

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const isOwner =
      targetUser._id.toString() === req.user._id.toString() ||
      (targetUser.phoneNumber && targetUser.phoneNumber === currentPhone) ||
      (currentEmail && targetUser.email === currentEmail);

    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this account" });
    }

    await User.findByIdAndDelete(targetUserId);

    return res.status(200).json({
      success: true,
      message: `Account @${targetUser.username} deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Multi-DP Photo Upload
// @route POST /api/auth/profile-photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    const user = await User.findById(req.user._id);

    const maxPhotos = user.isVIP ? 5 : 1;
    if (user.profilePhotos && user.profilePhotos.length >= maxPhotos) {
      return res.status(400).json({
        success: false,
        message: `Limit reached (${maxPhotos} DP max). Upgrade to VIP PRO for up to 5 DPs.`,
      });
    }

    if (!user.profilePhotos) user.profilePhotos = [];
    user.profilePhotos.unshift({ url: photoUrl, uploadedAt: new Date() });
    user.avatar = photoUrl;
    await user.save();

    return res.status(200).json({ success: true, profilePhotos: user.profilePhotos, avatar: user.avatar });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete DP Photo
// @route DELETE /api/auth/profile-photo/:photoId
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const user = await User.findById(req.user._id);

    user.profilePhotos = user.profilePhotos.filter((p) => p._id.toString() !== photoId);
    user.avatar = user.profilePhotos.length > 0 ? user.profilePhotos[0].url : "";
    await user.save();

    return res.status(200).json({
      success: true,
      profilePhotos: user.profilePhotos,
      avatar: user.avatar,
      fallback: user.profilePhotos.length === 0 ? user.avatarBitmojiFallback : null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update Profile Details
// @route PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      bio,
      avatar,
      avatarConfig,
      gender,
      dob,
      location,
      website,
      showPhone,
      showDob,
      coverBanner,
      isPrivateAccount,
      isGhostModeActive,
      hideReadReceipts,
      hdUploadEnabled,
    } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (avatarConfig !== undefined) updates.avatarConfig = avatarConfig;
    if (gender !== undefined) updates.gender = gender;
    if (location !== undefined) updates.location = location.trim();
    if (website !== undefined) updates.website = website.trim();
    if (showPhone !== undefined) updates.showPhone = Boolean(showPhone);
    if (showDob !== undefined) updates.showDob = Boolean(showDob);
    if (coverBanner !== undefined) updates.coverBanner = coverBanner;
    if (isPrivateAccount !== undefined) updates.isPrivateAccount = Boolean(isPrivateAccount);
    if (isGhostModeActive !== undefined) updates.isGhostModeActive = Boolean(isGhostModeActive);
    if (hideReadReceipts !== undefined) updates.hideReadReceipts = Boolean(hideReadReceipts);

    const currentUser = await User.findById(req.user._id);
    if (hdUploadEnabled !== undefined && currentUser?.isVIP) {
      updates.hdUploadEnabled = Boolean(hdUploadEnabled);
    }

    if (dob) {
      const parsedDate = new Date(dob);
      const birthYear = parsedDate.getFullYear();
      const currentYear = new Date().getFullYear();

      if (isNaN(parsedDate.getTime()) || birthYear < 1920 || birthYear > currentYear - 13) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid Date of Birth (Age must be at least 13).",
        });
      }

      updates.dob = parsedDate;
      let age = currentYear - birthYear;
      const m = new Date().getMonth() - parsedDate.getMonth();
      if (m < 0 || (m === 0 && new Date().getDate() < parsedDate.getDate())) {
        age--;
      }
      updates.age = age;
    } else if (dob === null || dob === "") {
      updates.dob = null;
      updates.age = null;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Verify & Activate VIP PRO Plan
// @route POST /api/auth/vip/activate
exports.activateVipPlan = async (req, res) => {
  try {
    const { plan, paymentId } = req.body;
    const userId = req.user._id;

    if (!["MONTHLY", "YEARLY"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid VIP subscription plan" });
    }

    const now = new Date();
    const expiryDate = new Date(
      plan === "MONTHLY" ? now.getTime() + 30 * 24 * 60 * 60 * 1000 : now.getTime() + 365 * 24 * 60 * 60 * 1000
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isVIP: true,
        vipPlan: plan,
        vipExpiresAt: expiryDate,
        vipPaymentId: paymentId || `KAF_VIP_${Date.now()}`,
        hdUploadEnabled: true,
        streakRecoveriesLeft: 5,
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: `👑 KafChat VIP PRO ${plan} Plan Activated!`,
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Send OTP
// @route POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber, phone } = req.body;
    const rawNumber = phoneNumber || phone;

    if (!rawNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const cleanNumber = rawNumber.toString().replace(/\D/g, "").slice(-10);
    if (cleanNumber.length !== 10) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit mobile number" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ $or: [{ phoneNumber: cleanNumber }, { phone: cleanNumber }] });
    if (!user) {
      user = new User({
        phoneNumber: cleanNumber,
        phone: cleanNumber,
        username: `user_${cleanNumber.slice(-4)}_${Date.now().toString().slice(-4)}`,
        fullName: `User ${cleanNumber.slice(-4)}`,
        password: crypto.randomBytes(16).toString("hex"),
      });
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanNumber}`,
      otp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Verify OTP
// @route POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, phone, otp } = req.body;
    const cleanNumber = (phoneNumber || phone || "").toString().replace(/\D/g, "").slice(-10);

    let user = await User.findOne({ $or: [{ phoneNumber: cleanNumber }, { phone: cleanNumber }] });

    if (otp && (!user || user.otp !== otp)) {
      return res.status(400).json({ success: false, message: "Invalid or incorrect OTP" });
    }

    if (otp && user && new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    const sessionId = crypto.randomBytes(16).toString("hex");

    if (!user) {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        phoneNumber: cleanNumber,
        message: "Phone verified. Please create your username and password.",
      });
    }

    user.otp = null;
    user.otpExpires = null;
    user.isPhoneVerified = true;
    user.isOnline = true;
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, sessionId);

    return res.status(200).json({
      success: true,
      user,
      token,
      sessionId,
      isNewUser: !user.password,
      phoneNumber: cleanNumber,
      message: "OTP Verified successfully!",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Change Password
// @route PATCH /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.password && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return res.status(200).json({ success: true, message: "Password changed successfully! 🎉" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Set / Update Chat Lock & Archive Vault PIN (100% User Defined)
// @route PATCH /api/auth/chat-lock-pin
exports.setChatLockPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ success: false, message: "PIN is required" });
    }

    const cleanPin = pin.toString().replace(/^\$/, "").replace(/\D/g, "").trim();
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      return res.status(400).json({ success: false, message: "PIN must be 4 to 6 digits" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { lockPin: cleanPin } },
      { new: true, runValidators: false }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: `Vault code saved successfully as $${cleanPin}! 🔐`,
      lockPin: cleanPin,
      user: updatedUser,
    });
  } catch (error) {
    console.error("setChatLockPin error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Reset / Override Chat Lock PIN using Account Password
// @route POST /api/auth/reset-chat-lock-pin
exports.resetChatLockPin = async (req, res) => {
  try {
    const { password, newPin } = req.body;
    if (!password || !newPin) {
      return res.status(400).json({ success: false, message: "Password and new PIN are required" });
    }

    const cleanPin = newPin.toString().replace(/^\$/, "").replace(/\D/g, "").trim();
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      return res.status(400).json({ success: false, message: "New PIN must be 4 to 6 digits" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await user.matchPassword(password.toString().trim());
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect account password" });
    }

    user.lockPin = cleanPin;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `Vault code successfully updated to $${cleanPin}! 🔐`,
      lockPin: cleanPin,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get Active Linked Devices
// @route GET /api/auth/sessions
exports.getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const currentSessionId = req.sessionId;

    const formattedSessions = (user.sessions || []).map((s) => ({
      sessionId: s.sessionId,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      browser: s.browser,
      os: s.os,
      isRoot: s.isRoot,
      lastActive: s.lastActive,
      isCurrent: s.sessionId === currentSessionId,
    }));

    return res.status(200).json({ success: true, sessions: formattedSessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc Logout Remote Device
// @route DELETE /api/auth/sessions/:sessionId
exports.logoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user._id);

    user.sessions = (user.sessions || []).filter((s) => s.sessionId !== sessionId);
    await user.save();

    return res.status(200).json({ success: true, message: "Device logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc Logout All Other Devices
// @route DELETE /api/auth/sessions
exports.logoutAllOtherSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const currentSessionId = req.sessionId;

    user.sessions = (user.sessions || []).filter((s) => s.sessionId === currentSessionId);
    await user.save();

    return res.status(200).json({ success: true, message: "Logged out from all other devices" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc Get Current User
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Local Logout
// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.user && req.sessionId) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { sessions: { sessionId: req.sessionId } },
      });
    }
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch {
    return res.status(200).json({ success: true, message: "Logged out" });
  }
};

// @desc Send Forgot Password OTP
// @route POST /api/auth/forgot-password-otp
exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Email or Mobile is required" });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const digitsOnly = cleanInput.replace(/\D/g, "");

    const conditions = [{ email: cleanInput }, { username: cleanInput }];
    if (digitsOnly.length >= 10) {
      conditions.push({ phoneNumber: digitsOnly.slice(-10) });
      conditions.push({ phone: digitsOnly.slice(-10) });
    }

    const user = await User.findOne({ $or: conditions });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this detail" });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "No email linked to this account for OTP recovery. Contact support.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (typeof sendOtpEmail === "function") {
      await sendOtpEmail(user.email, otp).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      email: user.email.replace(/(.{2})(.*)(?=@)/, "$1****"),
      targetEmail: user.email,
      message: `Reset OTP sent successfully!`,
    });
  } catch (error) {
    console.error("Forgot Password OTP Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send reset code" });
  }
};

// @desc Reset Password using OTP
// @route POST /api/auth/reset-password-otp
exports.resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or incorrect OTP" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request again." });
    }

    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};