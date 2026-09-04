const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["post", "reel"],
      default: "post",
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    filter: {
      type: String,
      default: "normal",
    },
    duration: {
      type: Number,
      default: 0,
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    audioTrack: {
      title: { type: String, default: "" },
      artist: { type: String, default: "" },
      audioUrl: { type: String, default: "" },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);