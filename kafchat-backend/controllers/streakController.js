const Streak = require("../models/Streak");
const User = require("../models/User");
const { processFileUpload } = require("../services/storageService");

// Helper: Evaluate 50 / 100 Days Reward Unlocks
const evaluateStreakMilestones = async (userId, streakCount) => {
  if (streakCount < 50) return;

  const updates = {};
  if (streakCount >= 50) {
    updates["streakPerks.fontsUnlocked"] = true;
    updates["streakPerks.colorsUnlocked"] = true;
  }
  if (streakCount >= 100) {
    updates["streakPerks.wallpapersUnlocked"] = true;
  }

  const user = await User.findById(userId);
  if (streakCount >= 100 && !user?.streakPerks?.bonusRecoveryGiven) {
    updates["streakPerks.bonusRecoveryGiven"] = true;
    updates["$inc"] = { streakRecoveriesLeft: 1 };
  }

  await User.findByIdAndUpdate(userId, updates);
};

// @desc Send / Exchange Snap (Updates Streak & Evaluates Milestones)
// @route POST /api/streaks/send
exports.sendSnap = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { recipientId } = req.body;
    let mediaUrl = req.body.mediaUrl;
    let mediaType = "image";

    if (req.file) {
      const uploaded = await processFileUpload(req.file, req);
      mediaUrl = uploaded.fileUrl;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    if (!recipientId || !mediaUrl) {
      return res.status(400).json({ success: false, message: "Recipient and Snap media are required" });
    }

    let streak = await Streak.findOne({
      users: { $all: [senderId, recipientId] },
    });

    const now = new Date();
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!streak) {
      streak = await Streak.create({
        users: [senderId, recipientId],
        streakCount: 1,
        lastSnapSentAt: now,
        expiresAt: expiryDate,
        sentToday: [senderId],
        status: "ACTIVE",
      });
    } else {
      // Check if expired
      if (now > streak.expiresAt) {
        streak.status = "BROKEN";
        streak.streakCount = 0;
      }

      // If other user also sent snap today, increment streak
      const otherUserSent = streak.sentToday.some((u) => u.toString() === recipientId.toString());
      if (otherUserSent && !streak.sentToday.includes(senderId)) {
        streak.streakCount += 1;
        streak.sentToday = [senderId];
        streak.expiresAt = expiryDate;
        streak.status = "ACTIVE";

        // Evaluate 50/100 Days Rewards
        await evaluateStreakMilestones(senderId, streak.streakCount);
        await evaluateStreakMilestones(recipientId, streak.streakCount);
      } else {
        if (!streak.sentToday.includes(senderId)) {
          streak.sentToday.push(senderId);
        }
      }
      streak.lastSnapSentAt = now;
      await streak.save();
    }

    return res.status(200).json({
      success: true,
      message: "Snap sent successfully! 🔥",
      streakCount: streak.streakCount,
      expiresAt: streak.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Save Snap to Dedicated Streak Vault (Not in normal chat)
// @route POST /api/streaks/:streakId/save-snap
exports.saveSnapToVault = async (req, res) => {
  try {
    const { streakId } = req.params;
    const { snapId, mediaUrl, mediaType } = req.body;
    const userId = req.user._id;

    const streak = await Streak.findById(streakId);
    if (!streak) return res.status(404).json({ success: false, message: "Streak record not found" });

    streak.savedSnapsVault.push({
      snapId: snapId || Date.now().toString(),
      sender: userId,
      mediaUrl,
      mediaType: mediaType || "image",
    });

    await streak.save();
    return res.status(200).json({ success: true, message: "Snap saved in Dedicated Streak Vault! 📌" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Restore Broken Streak (Free: 3 times, VIP: 5 times)
// @route POST /api/streaks/:streakId/restore
exports.restoreStreak = async (req, res) => {
  try {
    const { streakId } = req.params;
    const user = await User.findById(req.user._id);

    if (user.streakRecoveriesLeft <= 0) {
      return res.status(400).json({
        success: false,
        message: "No streak restores left! Upgrade to VIP PRO for additional recoveries.",
      });
    }

    const streak = await Streak.findById(streakId);
    if (!streak) return res.status(404).json({ success: false, message: "Streak record not found" });

    streak.status = "ACTIVE";
    streak.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await streak.save();

    user.streakRecoveriesLeft -= 1;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Streak Restored! 🔥 (${user.streakRecoveriesLeft} restores remaining)`,
      recoveriesLeft: user.streakRecoveriesLeft,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get Streak Details & Saved Vault
// @route GET /api/streaks/:partnerId
exports.getStreakDetails = async (req, res) => {
  try {
    const myId = req.user._id;
    const { partnerId } = req.params;

    const streak = await Streak.findOne({
      users: { $all: [myId, partnerId] },
    }).populate("users", "fullName username avatar isVIP");

    return res.status(200).json({ success: true, streak: streak || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};