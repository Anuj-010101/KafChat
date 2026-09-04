const Call = require("../models/Call");
const Chat = require("../models/Chat");
const User = require("../models/User");
const crypto = require("crypto");

// @desc    Get Call History (1-on-1 & Group with details)
// @route   GET /api/calls?chatId=<id>&page=1&limit=20
// @access  Private
exports.getCallHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const { chatId } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { caller: myId },
        { receiver: myId },
        { "participants.user": myId },
      ],
    };

    if (chatId) filter.chatId = chatId;

    const [calls, total] = await Promise.all([
      Call.find(filter)
        .populate("caller", "fullName username avatar profilePhotos isVIP")
        .populate("receiver", "fullName username avatar profilePhotos isVIP")
        .populate("participants.user", "fullName username avatar profilePhotos")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Call.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      calls,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + calls.length < total,
      },
    });
  } catch (error) {
    console.error("getCallHistory error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching call history" });
  }
};

// @desc    Initiate a 1-on-1 or Group Call
// @route   POST /api/calls/initiate
// @access  Private
exports.initiateCall = async (req, res) => {
  try {
    const { chatId, receiverId, callType, isGroupCall, noiseCancellationEnabled, activeLiveFilter } = req.body;
    const callerId = req.user._id;

    if (!chatId || !callType) {
      return res.status(400).json({ success: false, message: "ChatId and callType are required" });
    }

    const newCall = await Call.create({
      chatId,
      caller: callerId,
      receiver: receiverId || null,
      isGroupCall: Boolean(isGroupCall),
      callType: callType === "video" ? "video" : "audio",
      noiseCancellationEnabled: noiseCancellationEnabled !== undefined ? noiseCancellationEnabled : true,
      activeLiveFilter: activeLiveFilter || "none",
      status: "ongoing",
      participants: [{ user: callerId, isMuted: false, isVideoOff: callType === "audio" }],
    });

    const populated = await Call.findById(newCall._id)
      .populate("caller", "fullName username avatar profilePhotos isVIP")
      .populate("receiver", "fullName username avatar profilePhotos isVIP");

    return res.status(201).json({ success: true, call: populated });
  } catch (error) {
    console.error("initiateCall error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to initiate call" });
  }
};

// @desc    Generate Guarded Remote Session PIN (PRO Only)
// @route   POST /api/calls/:callId/remote-pin
// @access  Private
exports.createRemoteControlSession = async (req, res) => {
  try {
    const { callId } = req.params;
    const { targetUserId } = req.body;
    const myId = req.user._id;

    if (!req.user.isVIP) {
      return res.status(403).json({
        success: false,
        message: "Guarded Remote Control is exclusive to VIP PRO users.",
      });
    }

    const call = await Call.findById(callId);
    if (!call || call.status !== "ongoing") {
      return res.status(404).json({ success: false, message: "Active ongoing call session not found." });
    }

    // Generate Secure 6-Digit PIN
    const sessionPin = Math.floor(100000 + Math.random() * 900000).toString();

    call.remoteControlSession = {
      isActive: false, // Remains inactive until 2FA PIN is verified by receiver
      controlledBy: myId,
      targetUser: targetUserId,
      sessionPin,
      is2FAConfirmed: false,
      emergencyKillTriggered: false,
    };

    await call.save();

    return res.status(200).json({
      success: true,
      sessionPin,
      message: "Remote control PIN generated. Awaiting target user consent.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Remote 2FA PIN & Activate Session
// @route   POST /api/calls/:callId/verify-remote-pin
// @access  Private
exports.verifyRemoteControlPin = async (req, res) => {
  try {
    const { callId } = req.params;
    const { pin } = req.body;
    const myId = req.user._id;

    const call = await Call.findById(callId);
    if (!call || !call.remoteControlSession) {
      return res.status(404).json({ success: false, message: "Remote session not found" });
    }

    if (call.remoteControlSession.targetUser?.toString() !== myId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized target device." });
    }

    if (call.remoteControlSession.sessionPin !== pin) {
      return res.status(400).json({ success: false, message: "Invalid 6-digit Remote PIN." });
    }

    call.remoteControlSession.isActive = true;
    call.remoteControlSession.is2FAConfirmed = true;
    await call.save();

    return res.status(200).json({
      success: true,
      message: "Remote control session verified and active.",
      remoteSession: call.remoteControlSession,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger 1-Tap Emergency Kill-Switch for Remote Control
// @route   POST /api/calls/:callId/kill-remote
// @access  Private
exports.emergencyKillRemote = async (req, res) => {
  try {
    const { callId } = req.params;
    const call = await Call.findById(callId);
    if (!call) return res.status(404).json({ success: false, message: "Call not found" });

    call.remoteControlSession.isActive = false;
    call.remoteControlSession.emergencyKillTriggered = true;
    await call.save();

    return res.status(200).json({
      success: true,
      message: "Remote control access revoked instantly.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};