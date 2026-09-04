const mongoose = require("mongoose");

const reelCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const reelSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    cleanDownloadUrl: {
      type: String,
      default: null,
    },
    watermarkedUrl: {
      type: String,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    filter: {
      type: String,
      default: "normal",
    },
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
    comments: [reelCommentSchema],
    viewsCount: {
      type: Number,
      default: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

reelSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Reel", reelSchema);