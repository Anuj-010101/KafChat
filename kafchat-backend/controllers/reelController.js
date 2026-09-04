const Reel = require("../models/Reel");
const Activity = require("../models/Activity");
const { processFileUpload } = require("../services/storageService");

exports.createReel = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const isVIP = req.user.isVIP;
    let videoUrl = req.body.videoUrl;

    if (req.file) {
      const uploaded = await processFileUpload(req.file, req);
      videoUrl = uploaded.fileUrl;
    }

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: "Video file or URL is required" });
    }

    const {
      caption = "",
      thumbnailUrl = "",
      duration = 0,
      filter = "normal",
      audioTitle = "",
      audioArtist = "",
      audioUrl = "",
    } = req.body;

    const maxDurationLimit = isVIP ? 300 : 90;
    const parsedDuration = Number(duration) || 0;
    const finalDuration = Math.min(parsedDuration, maxDurationLimit);

    const newReel = await Reel.create({
      creator: creatorId,
      videoUrl,
      cleanDownloadUrl: videoUrl,
      watermarkedUrl: videoUrl,
      thumbnailUrl,
      caption,
      duration: finalDuration,
      filter,
      audioTrack: {
        title: audioTitle,
        artist: audioArtist,
        audioUrl,
      },
    });

    const populated = await Reel.findById(newReel._id).populate(
      "creator",
      "fullName username avatar profilePhotos isVIP"
    );

    return res.status(201).json({ success: true, reel: populated });
  } catch (error) {
    console.error("createReel error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReelsFeed = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 15, 30);
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .populate("creator", "fullName username avatar profilePhotos isVIP isOnline")
      .populate("comments.user", "fullName username avatar profilePhotos")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ success: true, reels: reels || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleLikeReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    const isLiked = reel.likes.some((id) => id.toString() === userId.toString());
    if (isLiked) {
      reel.likes = reel.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      reel.likes.push(userId);
      if (reel.creator.toString() !== userId.toString()) {
        await Activity.create({
          recipient: reel.creator,
          sender: userId,
          type: "LIKE_REEL",
          metadata: { reelId: reel._id },
        });
      }
    }

    await reel.save();
    return res.status(200).json({ success: true, isLiked: !isLiked, likesCount: reel.likes.length, userId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.incrementReelView = async (req, res) => {
  try {
    const { reelId } = req.params;
    await Reel.findByIdAndUpdate(reelId, { $inc: { viewsCount: 1 } });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.incrementReelShare = async (req, res) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      reelId,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    return res.status(200).json({ success: true, sharesCount: reel.sharesCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReelLikers = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { search } = req.query;

    const reel = await Reel.findById(reelId).populate(
      "likes",
      "fullName username avatar profilePhotos isVIP followers following"
    );

    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    let likers = reel.likes || [];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      likers = likers.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ success: true, count: likers.length, likers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const isVIP = req.user.isVIP;

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    return res.status(200).json({
      success: true,
      downloadUrl: isVIP ? reel.cleanDownloadUrl || reel.videoUrl : reel.watermarkedUrl || reel.videoUrl,
      isNoWatermark: Boolean(isVIP),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment cannot be empty" });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });

    reel.comments.push({ user: userId, text: text.trim() });
    await reel.save();

    const updated = await Reel.findById(reelId).populate("comments.user", "fullName username avatar profilePhotos");
    return res.status(201).json({ success: true, comments: updated.comments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};