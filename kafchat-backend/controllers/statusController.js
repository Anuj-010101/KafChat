const Status = require("../models/Status");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const { processFileUpload, deleteFileFromStorage } = require("../services/storageService");

exports.createStatus = async (req, res) => {
  try {
    const isVIP = req.user.isVIP;
    let mediaUrl = req.body.mediaUrl || "";
    let mediaType = req.body.mediaType || "image";

    if (req.file) {
      const uploaded = await processFileUpload(req.file, req);
      mediaUrl = uploaded.fileUrl;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const {
      text = "",
      caption = "",
      backgroundColor = "#0284C7",
      textColor = "#ffffff",
      fontFamily = "sans-serif",
      hasTextHighlight = false,
      attachedSong = null,
      audioTitle = "",
      stickers = [],
      privacy = "everyone",
      duration = 10,
      isReshare = false,
      reshareSnapshot = null,
      originalAuthor = null,
    } = req.body;

    const parsedStickers = typeof stickers === "string" ? JSON.parse(stickers) : (stickers || []);
    const parsedReshareSnapshot = typeof reshareSnapshot === "string" ? JSON.parse(reshareSnapshot) : reshareSnapshot;
    const parsedAttachedSong = typeof attachedSong === "string" ? JSON.parse(attachedSong) : attachedSong;

    const maxDurationLimit = isVIP ? 60 : 30;
    let finalDuration = Number(duration) || 10;
    if (finalDuration > maxDurationLimit) finalDuration = maxDurationLimit;

    let songData = {};
    if (parsedAttachedSong && typeof parsedAttachedSong === "object") {
      songData = {
        title: parsedAttachedSong.title || "",
        artist: parsedAttachedSong.artist || "",
        audioUrl: parsedAttachedSong.audioUrl || "",
      };
    } else if (audioTitle) {
      songData = { title: audioTitle, artist: "", audioUrl: "" };
    }

    const status = await Status.create({
      user: req.user._id,
      mediaType,
      mediaUrl: mediaUrl || null,
      text: caption || text || "",
      duration: finalDuration,
      backgroundColor,
      textColor,
      fontFamily,
      hasTextHighlight: Boolean(hasTextHighlight),
      isReshare: Boolean(isReshare),
      reshareSnapshot: parsedReshareSnapshot || null,
      originalAuthor: originalAuthor || null,
      stickers: parsedStickers,
      attachedSong: songData,
      privacy: privacy === "close_friends" ? "close_friends" : "everyone",
    });

    const populated = await Status.findById(status._id).populate(
      "user",
      "fullName username avatar profilePhotos avatarBitmojiFallback isVIP isGhostModeActive"
    );

    const mentionStickers = parsedStickers.filter((s) => s.type === "mention");
    for (const st of mentionStickers) {
      const rawUsername = st.value.replace(/^@/, "").trim().toLowerCase();
      const mentionedUser = await User.findOne({ username: rawUsername });

      if (mentionedUser && mentionedUser._id.toString() !== req.user._id.toString()) {
        let chat = await Chat.findOne({
          isGroupChat: false,
          participants: { $all: [req.user._id, mentionedUser._id] },
        });

        if (!chat) {
          chat = await Chat.create({
            participants: [req.user._id, mentionedUser._id],
            isGroupChat: false,
          });
        }

        const notifyMsg = await Message.create({
          chat: chat._id,
          chatId: chat._id,
          sender: req.user._id,
          text: `Mentioned you in their story. Tap to view and reshare to your story! 📸`,
          mediaType: status.mediaType === "text" ? "none" : (status.mediaType || "image"),
          mediaUrl: status.mediaUrl || null,
          storyContext: {
            statusId: status._id,
            authorId: req.user._id,
            mediaType: status.mediaType,
            mediaUrl: status.mediaUrl || null,
            text: status.text || "",
            backgroundColor: status.backgroundColor || "#0284C7",
            textColor: status.textColor || "#ffffff",
            canReshare: true,
          },
        });

        chat.lastMessage = notifyMsg._id;
        await chat.save();
      }
    }

    return res.status(201).json({ success: true, status: populated });
  } catch (error) {
    console.error("createStatus error:", error);
    return res.status(400).json({ success: false, message: error.message || "Couldn't post status" });
  }
};

exports.getStatusFeed = async (req, res) => {
  try {
    const myId = req.user._id;

    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "fullName username avatar profilePhotos avatarBitmojiFallback isVIP closeFriends")
      .populate("viewers.user", "fullName username avatar profilePhotos")
      .sort({ createdAt: 1 });

    const grouped = {};
    for (const s of statuses) {
      if (!s.user) continue;
      const isOwner = s.user._id.toString() === myId.toString();

      if (s.privacy === "close_friends" && !isOwner) {
        const isCloseFriend = s.user.closeFriends?.some((cfId) => cfId.toString() === myId.toString());
        if (!isCloseFriend) continue;
      }

      const uid = s.user._id.toString();
      if (!grouped[uid]) grouped[uid] = { user: s.user, statuses: [] };
      grouped[uid].statuses.push(s);
    }

    const feed = Object.values(grouped).sort(
      (a, b) =>
        new Date(b.statuses[b.statuses.length - 1].createdAt) -
        new Date(a.statuses[a.statuses.length - 1].createdAt)
    );

    return res.status(200).json({ success: true, feed });
  } catch (error) {
    console.error("getStatusFeed error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching statuses" });
  }
};

exports.viewStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const myId = req.user._id;
    const isGhostMode = Boolean(req.user.isGhostModeActive);

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ success: false, message: "Status not found" });

    if (status.user.toString() === myId.toString() || isGhostMode) {
      return res.status(200).json({ success: true, message: "Viewed anonymously / owner" });
    }

    const alreadyViewed = status.viewers.some(
      (v) => v.user && v.user.toString() === myId.toString()
    );

    if (!alreadyViewed) {
      await Status.updateOne(
        { _id: statusId, "viewers.user": { $ne: myId } },
        { $push: { viewers: { user: myId, viewedAt: new Date() } } }
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error marking status viewed" });
  }
};

exports.replyToStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const { text, emoji } = req.body;
    const myId = req.user._id;

    const status = await Status.findById(statusId).populate("user");
    if (!status) return res.status(404).json({ success: false, message: "Status no longer exists" });

    const targetUserId = status.user._id;
    if (targetUserId.toString() === myId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot reply to your own status" });
    }

    let chat = await Chat.findOne({
      isGroupChat: false,
      participants: { $all: [myId, targetUserId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [myId, targetUserId],
        isGroupChat: false,
      });
    }

    const replyContent = emoji
      ? `Reacted ${emoji} to your story`
      : `Replied: "${text}"`;

    const message = await Message.create({
      chat: chat._id,
      chatId: chat._id,
      sender: myId,
      text: replyContent,
      mediaType: status.mediaType === "text" ? "none" : (status.mediaType || "image"),
      mediaUrl: status.mediaUrl || null,
      storyContext: {
        statusId: status._id,
        authorId: status.user._id,
        mediaType: status.mediaType,
        mediaUrl: status.mediaUrl || null,
        text: status.text || "",
        backgroundColor: status.backgroundColor || "#0284C7",
        textColor: status.textColor || "#ffffff",
        reactionEmoji: emoji || null,
        canReshare: false,
      },
    });

    chat.lastMessage = message._id;
    await chat.save();

    return res.status(200).json({ success: true, message: "Reply sent to chat", chatMessage: message });
  } catch (error) {
    console.error("replyToStatus error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to reply to story" });
  }
};

exports.votePollSticker = async (req, res) => {
  try {
    const { statusId, stickerId } = req.params;
    const { optionIndex } = req.body;
    const myId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ success: false, message: "Status not found" });

    const sticker = status.stickers.id(stickerId);
    if (!sticker || sticker.type !== "poll") {
      return res.status(400).json({ success: false, message: "Poll sticker not found" });
    }

    sticker.pollOptions.forEach((opt) => {
      opt.votes = opt.votes.filter((v) => v.toString() !== myId.toString());
    });

    if (sticker.pollOptions[optionIndex]) {
      sticker.pollOptions[optionIndex].votes.push(myId);
    }

    await status.save();
    return res.status(200).json({ success: true, sticker });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to record vote" });
  }
};

exports.replyQaSticker = async (req, res) => {
  try {
    const { statusId, stickerId } = req.params;
    const { response } = req.body;
    const myId = req.user._id;

    if (!response || !response.trim()) {
      return res.status(400).json({ success: false, message: "Response cannot be empty" });
    }

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ success: false, message: "Status not found" });

    const sticker = status.stickers.id(stickerId);
    if (!sticker || sticker.type !== "qa") {
      return res.status(400).json({ success: false, message: "Q&A sticker not found" });
    }

    sticker.qaResponses.push({
      user: myId,
      response: response.trim(),
    });

    await status.save();
    return res.status(200).json({ success: true, message: "Response sent" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to submit response" });
  }
};

exports.voteSliderSticker = async (req, res) => {
  try {
    const { statusId, stickerId } = req.params;
    const { value } = req.body;
    const myId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ success: false, message: "Status not found" });

    const sticker = status.stickers.id(stickerId);
    if (!sticker || sticker.type !== "slider") {
      return res.status(400).json({ success: false, message: "Slider sticker not found" });
    }

    const existingVote = sticker.sliderVotes.find((v) => v.user.toString() === myId.toString());
    if (existingVote) {
      existingVote.value = Number(value);
    } else {
      sticker.sliderVotes.push({ user: myId, value: Number(value) });
    }

    await status.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to record slider response" });
  }
};

exports.deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findById(statusId);
    if (!status) return res.status(404).json({ success: false, message: "Status not found" });

    if (!status.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "You can only delete your own status" });
    }

    if (status.mediaUrl) {
      await deleteFileFromStorage(status.mediaUrl);
    }

    await status.deleteOne();
    return res.status(200).json({ success: true, message: "Status & media purged successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error deleting status" });
  }
};