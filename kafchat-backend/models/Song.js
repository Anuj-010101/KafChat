const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    audioUrl: { type: String, required: true }, // Public working .mp3 CDN link
    duration: { type: Number, default: 30 }, // in seconds
    thumbnailUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Song", songSchema);