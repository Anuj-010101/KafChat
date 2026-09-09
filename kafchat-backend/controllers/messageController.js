const Message = require("../models/Message");
const Chat = require("../models/Chat");
const mongoose = require("mongoose");
const { processFileUpload } = require("../services/storageService");

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// @desc Get all messages for a specific chat (Includes Anti-Delete Pro recovery logic)
// @route GET /api/messages/:chatId
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const isVIP = Boolean(req.user.isVIP);

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);

    const chat = await Chat.findOne({
      _id: targetChatId,
      participants: userId,
    });

    if (!chat) {
      return res.status(403).json({ success: false, message: "Not authorized to view messages in this chat" });
    }

    // Auto mark all unread messages as read
    await Message.updateMany(
      {
        chatId: targetChatId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId, deliveredTo: userId },
      }
    );

    // Auto cleanup timed disappearing messages
    if (chat.disappearingTimer && ["24h", "7d", "90d"].includes(chat.disappearingTimer)) {
      const now = new Date();
      let expiryTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (chat.disappearingTimer === "7d") expiryTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (chat.disappearingTimer === "90d") expiryTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      await Message.deleteMany({
        chatId: targetChatId,
        createdAt: { $lt: expiryTime },
        isVaultFile: { $ne: true },
      });
    }

    const rawMessages = await Message.find({
      chatId: targetChatId,
      deletedBy: { $ne: userId },
    })
      .populate("sender", "fullName username avatar profilePhotos avatarBitmojiFallback isVIP isOnline lastSeen publicKey")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "fullName username avatar" },
      })
      .populate("forwardedFrom", "fullName username avatar")
      .sort({ createdAt: 1 });

    const messages = rawMessages.map((m) => {
      const msgObj = m.toObject();
      if (msgObj.deletedForEveryone) {
        if (isVIP) {
          // Pro / VIP user sees the original message with an anti-delete recovered indicator tag
          msgObj.isAntiDeleteRecovered = true;
        } else {
          // Normal user sees standard placeholder
          msgObj.text = "This message was deleted";
          msgObj.encryptedContent = "";
          msgObj.iv = "";
          msgObj.mediaUrl = null;
          msgObj.waveformData = [];
        }
      }
      return msgObj;
    });

    return res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages || [],
    });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load messages",
      messages: [],
    });
  }
};

// @desc Send a new message (E2EE payload, Waveform Voice Notes, Polls)
// @route POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const {
      chatId,
      text,
      encryptedContent,
      iv,
      mediaUrl,
      mediaType,
      voiceDurationSec,
      voicePitchFX,
      waveformData,
      fileName,
      fileSizeFormatted,
      isVaultFile,
      caption,
      pollData,
      replyTo,
      isForwarded,
      forwardedFrom,
      isViewOnce,
      storyContext,
    } = req.body;

    const senderId = req.user._id;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Valid Chat ID is required" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);

    const chat = await Chat.findById(targetChatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (chat.isGroupChat && chat.onlyAdminsCanMessage) {
      const isAdmin = chat.groupAdmins?.some((id) => id.equals(senderId)) || chat.groupAdmin?.equals(senderId);
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: "Only admins are allowed to send messages in this group" });
      }
    }

    const normalizedMediaType = !mediaType || mediaType === "none" ? "text" : mediaType;

    const newMessage = await Message.create({
      chatId: targetChatId,
      sender: senderId,
      text: text || "",
      encryptedContent: encryptedContent || "",
      iv: iv || "",
      mediaUrl: mediaUrl || null,
      mediaType: normalizedMediaType,
      voiceDurationSec: Number(voiceDurationSec) || 0,
      voicePitchFX: voicePitchFX || "NORMAL",
      waveformData: waveformData || [],
      fileName: fileName || "",
      fileSizeFormatted: fileSizeFormatted || "",
      isVaultFile: Boolean(isVaultFile),
      caption: caption || "",
      pollData: pollData || null,
      replyTo: replyTo || null,
      isForwarded: Boolean(isForwarded),
      forwardedFrom: forwardedFrom || null,
      isViewOnce: Boolean(isViewOnce),
      storyContext: storyContext || null,
      readBy: [senderId],
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "fullName username avatar profilePhotos avatarBitmojiFallback isVIP isOnline lastSeen publicKey")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "fullName username avatar" },
      })
      .populate("forwardedFrom", "fullName username avatar");

    await Chat.findByIdAndUpdate(targetChatId, {
      lastMessage: newMessage._id,
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: error.message || "Message send failed" });
  }
};

// @desc Upload Multiple Files in Batch
// @route POST /api/messages/upload-batch
exports.uploadBatchFiles = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const senderId = req.user._id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files received on server" });
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Valid ChatId is required" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);
    const chat = await Chat.findById(targetChatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const createdMessages = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const uploadedData = await processFileUpload(file, req);

      let mediaType = "document";
      if (file.mimetype.startsWith("image/")) mediaType = "image";
      else if (file.mimetype.startsWith("video/")) mediaType = "video";
      else if (file.mimetype.startsWith("audio/")) mediaType = "audio";

      const captionText = i === 0 && text ? text.trim() : "";

      const msg = await Message.create({
        chatId: targetChatId,
        sender: senderId,
        text: captionText,
        mediaUrl: uploadedData.fileUrl,
        mediaType,
        fileName: uploadedData.fileName,
        fileSizeFormatted: formatBytes(uploadedData.fileSize),
        isVaultFile: true,
        readBy: [senderId],
      });

      const populated = await Message.findById(msg._id).populate(
        "sender",
        "fullName username avatar profilePhotos isOnline lastSeen"
      );
      createdMessages.push(populated);
    }

    if (createdMessages.length > 0) {
      await Chat.findByIdAndUpdate(targetChatId, {
        lastMessage: createdMessages[createdMessages.length - 1]._id,
        updatedAt: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      messages: createdMessages,
    });
  } catch (error) {
    console.error("uploadBatchFiles error:", error);
    return res.status(500).json({ success: false, message: error.message || "Batch upload failed" });
  }
};

// @desc Auto-Delete / Disappearing Cleanup
// @route POST /api/messages/cleanup-snap/:chatId
exports.cleanupSnapMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);
    const chat = await Chat.findById(targetChatId);
    if (!chat || chat.disappearingTimer !== "after_view") {
      return res.status(200).json({ success: true, count: 0 });
    }

    const deleteResult = await Message.deleteMany({
      chatId: targetChatId,
      isVaultFile: { $ne: true },
    });

    await Chat.findByIdAndUpdate(targetChatId, {
      lastMessage: null,
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      deletedCount: deleteResult.deletedCount,
      chatId,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Edit Message (15-Minute Rule)
// @route PATCH /api/messages/:messageId
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, encryptedContent, iv } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages" });
    }

    if (message.deletedForEveryone) {
      return res.status(400).json({ success: false, message: "Cannot edit deleted message" });
    }

    const elapsedMinutes = (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60);
    if (elapsedMinutes > 15) {
      return res.status(400).json({ success: false, message: "The 15-minute edit window has expired." });
    }

    if (text) message.text = text.trim();
    if (encryptedContent) message.encryptedContent = encryptedContent;
    if (iv) message.iv = iv;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populated = await Message.findById(messageId)
      .populate("sender", "fullName username avatar profilePhotos isOnline")
      .populate({
        path: "replyTo",
        populate: { path: "sender", select: "fullName username avatar" },
      });

    return res.status(200).json({ success: true, message: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Mark Read
// @route PATCH /api/messages/read/:chatId
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Invalid chat ID" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);

    await Message.updateMany(
      {
        chatId: targetChatId,
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId, deliveredTo: userId },
      }
    );

    return res.status(200).json({ success: true, message: "Messages marked read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Vote Poll
// @route PATCH /api/messages/:messageId/vote
exports.votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || !message.pollData) {
      return res.status(404).json({ success: false, message: "Poll message not found" });
    }

    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= message.pollData.options.length) {
      return res.status(400).json({ success: false, message: "Invalid poll option index" });
    }

    const option = message.pollData.options[optionIndex];
    const alreadyVotedIndex = option.votes.findIndex((id) => id.toString() === userId.toString());

    if (alreadyVotedIndex > -1) {
      option.votes.splice(alreadyVotedIndex, 1);
    } else {
      if (!message.pollData.allowMultipleAnswers) {
        message.pollData.options.forEach((opt) => {
          opt.votes = opt.votes.filter((id) => id.toString() !== userId.toString());
        });
      }
      option.votes.push(userId);
    }

    message.markModified("pollData");
    await message.save();

    return res.status(200).json({
      success: true,
      pollData: message.pollData,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Voting failed" });
  }
};

// @desc Toggle Pin
// @route PATCH /api/messages/:messageId/pin
exports.togglePin = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    return res.status(200).json({
      success: true,
      isPinned: message.isPinned,
      message,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get Pinned
// @route GET /api/messages/:chatId/pinned
exports.getPinnedMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const targetChatId = new mongoose.Types.ObjectId(chatId);

    const pinnedMessages = await Message.find({ chatId: targetChatId, isPinned: true })
      .populate("sender", "fullName username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, messages: pinnedMessages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete Message
// @route DELETE /api/messages/:messageId
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone } = req.query;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (forEveryone === "true") {
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Cannot delete for everyone" });
      }
      message.deletedForEveryone = true;
      message.deletedAt = new Date();
      await message.save();

      const populated = await Message.findById(messageId)
        .populate("sender", "fullName username avatar profilePhotos")
        .populate({
          path: "replyTo",
          populate: { path: "sender", select: "fullName username avatar" },
        });

      return res.status(200).json({ success: true, message: populated });
    } else {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deletedBy: userId },
      });
      return res.status(200).json({ success: true, message: "Deleted for you" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Clear Chat
// @route DELETE /api/messages/clear/:chatId
exports.clearChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const targetChatId = new mongoose.Types.ObjectId(chatId);

    await Message.updateMany(
      { chatId: targetChatId },
      { $addToSet: { deletedBy: userId } }
    );

    return res.status(200).json({ success: true, message: "Chat cleared for you" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc React to Message
// @route POST /api/messages/:messageId/react
exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (!message.reactions) message.reactions = [];

    message.reactions = message.reactions.filter((r) => r.user.toString() !== userId.toString());

    if (emoji) {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();
    return res.status(200).json({ success: true, reactions: message.reactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Search Messages
// @route GET /api/messages/:chatId/search
exports.searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { query } = req.query;
    const userId = req.user._id;
    const targetChatId = new mongoose.Types.ObjectId(chatId);

    if (!query || !query.trim()) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const messages = await Message.find({
      chatId: targetChatId,
      deletedBy: { $ne: userId },
      deletedForEveryone: { $ne: true },
      text: { $regex: query.trim(), $options: "i" },
    })
      .populate("sender", "fullName username avatar profilePhotos")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};