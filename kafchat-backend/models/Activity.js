const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "FOLLOW_REQUEST",
        "FOLLOW_ACCEPT",
        "REQUEST_ACCEPTED",
        "REQUEST_REJECTED",
        "SCREENSHOT_ALERT",
        "CALL_MISSED",
        "LIKE_POST",
        "LIKE_REEL",
        "MENTION_STORY",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "LOGGED"],
      default: "PENDING",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);