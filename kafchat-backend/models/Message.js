const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const pollOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const storyContextSchema = new mongoose.Schema(
  {
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mediaType: { type: String, enum: ["text", "image", "video", "none"], default: "none" },
    mediaUrl: { type: String, default: null },
    text: { type: String, default: "" },
    backgroundColor: { type: String, default: "#0284C7" },
    textColor: { type: String, default: "#ffffff" },
    reactionEmoji: { type: String, default: null },
    canReshare: { type: Boolean, default: false },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔐 Pure E2EE Encrypted Payload
    text: { type: String, default: "" },
    recoveredText: { type: String, default: "" },
    encryptedContent: { type: String, default: "" },
    iv: { type: String, default: "" },
    mediaUrl: { type: String, default: null },
    mediaType: {
      type: String,
      enum: ["text", "none", "image", "audio", "video", "document", "poll", "voice_note"],
      default: "text",
    },
    fileName: { type: String, default: "" },
    fileSizeFormatted: { type: String, default: "" },
    isVaultFile: { type: Boolean, default: false },
    caption: { type: String, default: "" },

    // 📸 WhatsApp & Instagram Story Context (Reactions, Replies, Mentions)
    storyContext: {
      type: storyContextSchema,
      default: null,
    },

    // 🎙️ Voice Notes with Waveform & Pitch FX
    voiceDurationSec: { type: Number, default: 0 },
    voicePitchFX: {
      type: String,
      enum: ["NORMAL", "LOW_PITCH", "HIGH_PITCH", "ROBOT", "GHOST"],
      default: "NORMAL",
    },
    waveformData: [{ type: Number }],

    // 📊 Interactive Polls
    pollData: {
      question: { type: String },
      options: [pollOptionSchema],
      allowMultipleAnswers: { type: Boolean, default: false },
    },

    // ⚡ View-Once (Self-Destruct)
    isViewOnce: { type: Boolean, default: false },
    isViewed: { type: Boolean, default: false },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isForwarded: { type: Boolean, default: false },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reactions: [reactionSchema],
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 🚫 Anti-Delete Engine (PRO retains original, Free sees 'deleted')
    deletedForEveryone: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ✏️ 15-Minute Edit Window
    isPinned: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;