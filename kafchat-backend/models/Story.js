const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    duration: {
      type: Number, // Max 120s = 2 mins
      default: 15,
    },
    filter: {
      type: String,
      default: "normal",
    },
    overlays: [
      {
        type: { type: String, enum: ["text", "sticker", "mention"] },
        text: String,
        x: Number,
        y: Number,
        color: String,
        fontSize: Number,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    audioTrack: {
      title: { type: String, default: "" },
      audioUrl: { type: String, default: "" },
    },
    viewers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    // 24 Hour TTL Auto-Delete
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);