const mongoose = require("mongoose");
const { deleteFileFromStorage } = require("../services/storageService");

const statusViewerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const pollOptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: true }
);

const qaResponseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    response: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const stickerItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mention", "hashtag", "text", "poll", "qa", "slider", "location"],
      default: "text",
    },
    value: { type: String, default: "" },
    x: { type: Number, default: 50 },
    y: { type: Number, default: 50 },
    scale: { type: Number, default: 1 },
    fontFamily: { type: String, default: "sans-serif" },
    styleType: { type: String, enum: ["pill", "solid", "neon", "classic"], default: "pill" },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    hasTextHighlight: { type: Boolean, default: false },
    pollQuestion: { type: String, default: "" },
    pollOptions: [pollOptionSchema],
    qaQuestion: { type: String, default: "Ask me anything" },
    qaResponses: [qaResponseSchema],
    sliderEmoji: { type: String, default: "🔥" },
    sliderVotes: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        value: { type: Number, min: 0, max: 100, default: 50 },
      },
    ],
  },
  { _id: true }
);

const reshareSnapshotSchema = new mongoose.Schema(
  {
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: { type: String, default: "" },
    authorUsername: { type: String, default: "" },
    authorAvatar: { type: String, default: "" },
    mediaType: { type: String, default: "text" },
    mediaUrl: { type: String, default: null },
    text: { type: String, default: "" },
    backgroundColor: { type: String, default: "#0284C7" },
    textColor: { type: String, default: "#ffffff" },
    fontFamily: { type: String, default: "sans-serif" },
    hasTextHighlight: { type: Boolean, default: false },
  },
  { _id: false }
);

const StatusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      required: true,
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    // Instagram Multi-photo Layout Support
    layout: {
      type: String,
      enum: ["single", "grid", "vertical", "horizontal"],
      default: "single",
    },
    layoutImages: {
      type: [String],
      default: [],
    },
    text: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    // Resharer (User 2) Overlay caption
    overlayText: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    stickers: [stickerItemSchema],
    duration: {
      type: Number,
      default: 10,
    },
    backgroundColor: {
      type: String,
      default: "#0284C7",
    },
    textColor: {
      type: String,
      default: "#ffffff",
    },
    fontFamily: {
      type: String,
      default: "sans-serif",
    },
    hasTextHighlight: {
      type: Boolean,
      default: false,
    },
    isReshare: {
      type: Boolean,
      default: false,
    },
    originalAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reshareSnapshot: {
      type: reshareSnapshotSchema,
      default: null,
    },
    attachedSong: {
      title: { type: String, default: "" },
      artist: { type: String, default: "" },
      audioUrl: { type: String, default: "" },
    },
    viewers: [statusViewerSchema],
    privacy: {
      type: String,
      enum: ["everyone", "contacts", "close_friends"],
      default: "everyone",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Storage cleanup hook (Handles single mediaUrl + all layoutImages)
StatusSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  if (this.mediaUrl) {
    await deleteFileFromStorage(this.mediaUrl);
  }
  if (Array.isArray(this.layoutImages) && this.layoutImages.length > 0) {
    for (const imgUrl of this.layoutImages) {
      if (imgUrl && imgUrl !== this.mediaUrl) {
        await deleteFileFromStorage(imgUrl);
      }
    }
  }
  next();
});

StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StatusSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Status", StatusSchema);