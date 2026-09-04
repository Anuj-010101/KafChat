const mongoose = require("mongoose");

const savedSnapSchema = new mongoose.Schema({
  snapId: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], default: "image" },
  savedAt: { type: Date, default: Date.now },
});

const streakSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    streakCount: {
      type: Number,
      default: 0,
    },
    // 24-hour expiry window
    lastSnapSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["ACTIVE", "WARNING", "BROKEN"],
      default: "ACTIVE",
    },
    // Who has sent snap in the current 24h window
    sentToday: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Dedicated Saved Snaps Vault (Isolated from normal chat list)
    savedSnapsVault: [savedSnapSchema],
  },
  { timestamps: true }
);

streakSchema.index({ users: 1 });
streakSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Streak", streakSchema);