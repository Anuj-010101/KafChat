const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isVideoOff: {
      type: Boolean,
      default: false,
    },
    isScreenSharing: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const CallSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Group calls me null rahega
    },
    isGroupCall: {
      type: Boolean,
      default: false,
    },
    participants: [participantSchema],
    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["missed", "rejected", "completed", "ongoing", "busy"],
      default: "ongoing",
    },

    // 🛡️ WebRTC & Suite Features
    isScreenShareActive: {
      type: Boolean,
      default: false,
    },
    screenSharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    watchPartyUrl: {
      type: String,
      default: null, // Watch Party sync link
    },
    noiseCancellationEnabled: {
      type: Boolean,
      default: true,
    },
    activeLiveFilter: {
      type: String,
      default: "none", // AR Filter name: "cyberpunk", "studio-light", "neon-devil", etc.
    },

    // 🔒 Guarded Remote Control Access (PRO)
    remoteControlSession: {
      isActive: { type: Boolean, default: false },
      controlledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      sessionPin: { type: String, default: null },
      is2FAConfirmed: { type: Boolean, default: false },
      emergencyKillTriggered: { type: Boolean, default: false },
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    durationInSeconds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CallSchema.index({ chatId: 1, createdAt: -1 });
CallSchema.index({ caller: 1 });
CallSchema.index({ receiver: 1 });

module.exports = mongoose.model("Call", CallSchema);