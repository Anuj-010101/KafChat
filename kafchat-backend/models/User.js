const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    deviceId: {
      type: String,
      required: true,
      default: () => `device_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    },
    deviceName: {
      type: String,
      default: "Browser Session",
    },
    browser: {
      type: String,
      default: "Browser",
    },
    os: {
      type: String,
      default: "Device",
    },
    ip: {
      type: String,
      default: "",
    },
    isRoot: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    // 👇 Naya field add karo (Bina kuch purana hataye)
    isUsernameSet: {
      type: Boolean,
      default: true, // Purane/Normal users ke liye true rahega
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    profilePhotos: [
      {
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    avatarConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    bio: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "Prefer not to say",
    },
    dob: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    showDob: {
      type: Boolean,
      default: false,
    },
    isPrivateAccount: {
      type: Boolean,
      default: false,
    },
    isGhostModeActive: {
      type: Boolean,
      default: false,
    },
    hideReadReceipts: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isVIP: {
      type: Boolean,
      default: false,
    },
    vipPlan: {
      type: String,
      enum: ["FREE", "MONTHLY", "YEARLY"],
      default: "FREE",
    },
    vipExpiresAt: {
      type: Date,
      default: null,
    },
    hdUploadEnabled: {
      type: Boolean,
      default: false,
    },
    lockPin: {
      type: String,
      default: null,
    },
    closeFriends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    streakRecoveriesLeft: {
      type: Number,
      default: 3,
    },
    rootDeviceId: {
      type: String,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    sessions: [sessionSchema],
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);