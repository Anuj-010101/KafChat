const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    isSelfChat: { type: Boolean, default: false },
    isSavedCloud: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    groupAvatar: { type: String, default: "" },
    groupDescription: { type: String, default: "" },
    onlyAdminsCanMessage: { type: Boolean, default: false },

    // Request System
    requestStatus: {
      type: String,
      enum: ["none", "pending", "accepted", "rejected"],
      default: "accepted",
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // WhatsApp + Snap Disappearing Modes:
    // 'off', 'after_view' (Snapchat style), '24h', '7d', '90d'
    disappearingTimer: {
      type: String,
      enum: ["off", "after_view", "24h", "7d", "90d"],
      default: "off",
    },
    disappearingChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    disappearingActivatedAt: { type: Date, default: null }, // Anchor timestamp

    // WhatsApp Style Pinned Chats (Per user)
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    mutedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        duration: { type: String, enum: ["8h", "24h", "always"], default: "8h" },
        mutedUntil: { type: Date, default: null },
      },
    ],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    customTones: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        toneName: { type: String, default: "Default (KafChat Tone)" },
      },
    ],
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;