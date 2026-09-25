const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// @desc Access or Create 1-on-1 Chat
// @route POST /api/chats/access
exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "UserId is required" });
  }

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      isSavedCloud: false,
      participants: { $all: [req.user._id, userId] },
    })
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("requestedBy", "fullName username avatar profilePhotos bio avatarConfig") // <-- Yahin par fullName aur username add karna hai
      .populate("lastMessage");

    if (isChat.length > 0) {
      return res.status(200).json({ success: true, chat: isChat[0] });
    }

    return res.status(200).json({ 
      success: true, 
      chat: null, 
      message: "No existing chat. Send a message to initiate request." 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Access Personal Cloud Space (Saved Messages)
// @route POST /api/chats/personal-vault
exports.accessPersonalVault = async (req, res) => {
  try {
    let vaultChat = await Chat.findOne({
      participants: req.user._id,
      isSavedCloud: true,
    })
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("lastMessage");

    if (!vaultChat) {
      vaultChat = await Chat.create({
        chatName: "Saved Messages",
        isGroupChat: false,
        isSelfChat: false,
        isSavedCloud: true,
        participants: [req.user._id],
        requestStatus: "accepted",
      });

      vaultChat = await Chat.findById(vaultChat._id).populate(
        "participants",
        "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen"
      );
    }

    return res.status(200).json({ success: true, chat: vaultChat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Fetch All User Chats (Includes Archived/Vault for filtering)
// @route GET /api/chats
exports.fetchChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isVIP = req.user.isVIP;

    await Chat.deleteMany({ participants: userId, isSelfChat: true });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await Chat.deleteMany({
      requestStatus: "pending",
      createdAt: { $lt: ninetyDaysAgo },
    });

    const hasCloud = await Chat.exists({ participants: userId, isSavedCloud: true });
    if (!hasCloud) {
      await Chat.create({
        chatName: "Saved Messages",
        isGroupChat: false,
        isSelfChat: false,
        isSavedCloud: true,
        participants: [userId],
      });
    }

    // 🚀 FIXED: Yahan se 'archivedBy: { $ne: userId }' hata diya hai taaki sabhi chats fetch ho sakein, 
    // aur frontend apne hisaab se normal ya archived list me dikha sake.
    const chats = await Chat.find({
      participants: { $elemMatch: {$eq: userId } },
      isSelfChat: { $ne: true },
    })
      .populate("participants", "fullName username avatar profilePhotos avatarBitmojiFallback avatarConfig isVIP isOnline lastSeen publicKey")
      .populate("requestedBy", "fullName username avatar profilePhotos bio avatarConfig")
      .populate("groupAdmin", "fullName username avatar avatarConfig")
      .populate("groupAdmins", "fullName username avatar avatarConfig")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "fullName username isVIP avatarConfig" },
      })
      .sort({ updatedAt: -1 });

    const now = new Date();

    const formattedChats = await Promise.all(
      chats.map(async (c) => {
        let unreadCount = 0;
        try {
          if (Message) {
            unreadCount = await Message.countDocuments({
              chatId: c._id,
              sender: { $ne: userId },
              "readBy.user": { $ne: userId },
              deletedBy: { $ne: userId },
            });
          }
        } catch {
          unreadCount = 0;
        }

        const chatObj = c.toObject();
        if (chatObj.isSavedCloud) chatObj.chatName = "Saved Messages";

        if (chatObj.lastMessage && chatObj.lastMessage.deletedForEveryone && !isVIP) {
          chatObj.lastMessage.text = "This message was deleted";
          chatObj.lastMessage.encryptedContent = "";
          chatObj.lastMessage.mediaUrl = null;
        }

        chatObj.unreadCount = unreadCount;
        chatObj.isLocked = c.lockedBy?.some((id) => id && id.toString() === userId.toString()) || false;
        chatObj.isArchived = c.archivedBy?.some((id) => id && id.toString() === userId.toString()) || false;
        chatObj.isPinned = c.pinnedBy?.some((id) => id && id.toString() === userId.toString()) || false;
        chatObj.isFavorite = c.favoriteBy?.some((id) => id && id.toString() === userId.toString()) || false;

        const userMute = c.mutedUsers?.find((m) => m.userId && m.userId.toString() === userId.toString());
        let isMuted = false;
        let muteDuration = "off";

        if (userMute) {
          if (userMute.duration === "always" || !userMute.mutedUntil || new Date(userMute.mutedUntil) > now) {
            isMuted = true;
            muteDuration = userMute.duration;
          }
        }

        chatObj.isMuted = isMuted;
        chatObj.muteDuration = muteDuration;

        return chatObj;
      })
    );

    return res.status(200).json({ success: true, chats: formattedChats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Chat Lock with Dynamic User-Defined PIN Verification
// @route POST /api/chats/:chatId/toggle-lock
exports.toggleLock = async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user._id;

    if (!pin) {
      return res.status(400).json({ success: false, message: "Please enter your passcode" });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser || !currentUser.lockPin) {
      return res.status(400).json({
        success: false,
        message: "Secret PIN not set! Please set your code in Settings.",
      });
    }

    const userStoredPin = currentUser.lockPin.toString().replace(/^\$/, "").trim();
    const inputCleanPin = pin.toString().replace(/^\$/, "").trim();

    if (userStoredPin !== inputCleanPin) {
      return res.status(401).json({ success: false, message: "Incorrect PIN passcode!" });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    if (!chat.lockedBy) chat.lockedBy = [];
    const isLocked = chat.lockedBy.some((id) => id && id.toString() === userId.toString());

    if (isLocked) {
      chat.lockedBy = chat.lockedBy.filter((id) => id && id.toString() !== userId.toString());
    } else {
      chat.lockedBy.push(userId);
    }

    await chat.save();
    return res.status(200).json({
      success: true,
      isLocked: !isLocked,
      message: !isLocked ? "Chat locked 🔒" : "Chat unlocked 🔓",
    });
  } catch (error) {
    console.error("toggleLock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Single-User Exit Cleanup for Auto-Delete on View
// @route POST /api/chats/:chatId/exit-cleanup
exports.exitChatCleanup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat || chat.disappearingTimer !== "after_view" || !chat.disappearingActivatedAt) {
      return res.status(200).json({ success: true, message: "No cleanup required" });
    }

    await Message.updateMany(
      {
        chatId,
        createdAt: { $gte: chat.disappearingActivatedAt },
        readBy: userId,
        deletedBy: { $ne: userId },
      },
      {
        $addToSet: { deletedBy: userId },
      }
    );

    return res.status(200).json({ success: true, message: "Viewed messages cleared for your view" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Archive Chat
// @route PATCH /api/chats/:chatId/archive
exports.toggleArchive = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const userId = req.user._id;
    if (!chat.archivedBy) chat.archivedBy = [];
    const isArchived = chat.archivedBy.some((id) => id && id.toString() === userId.toString());

    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter((id) => id && id.toString() !== userId.toString());
    } else {
      chat.archivedBy.push(userId);
    }

    await chat.save();
    return res.status(200).json({
      success: true,
      isArchived: !isArchived,
      message: !isArchived ? "Chat archived 📦" : "Chat unarchived",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Clear all messages in a chat
// @route DELETE /api/chats/:chatId/clear
exports.clearChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Valid Chat ID is required" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);
    await Message.deleteMany({ chatId: targetChatId });

    await Chat.findByIdAndUpdate(targetChatId, {
      lastMessage: null,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, message: "All messages cleared successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to clear chat" });
  }
};

// @desc Delete full conversation & thread
// @route DELETE /api/chats/:chatId
exports.deleteConversation = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ success: false, message: "Valid Chat ID is required" });
    }

    const targetChatId = new mongoose.Types.ObjectId(chatId);
    await Message.deleteMany({ chatId: targetChatId });
    await Chat.findByIdAndDelete(targetChatId);

    return res.status(200).json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete conversation" });
  }
};

// @desc Accept a chat message request
// @route PATCH /api/chats/:chatId/accept
exports.acceptRequest = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    chat.requestStatus = "accepted";
    await chat.save();

    if (chat.requestedBy) {
      await Activity.findOneAndUpdate(
        { sender: chat.requestedBy, recipient: userId, type: "FOLLOW_REQUEST" },
        { status: "ACCEPTED", isRead: true },
        { upsert: true }
      );

      if (chat.requestedBy.toString() !== userId.toString()) {
        await Notification.create({
          recipient: chat.requestedBy,
          sender: userId,
          type: "follow_accept",
          text: "accepted your message request",
        });
      }
    }

    const fullChat = await Chat.findById(chat._id)
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("requestedBy", "fullName username avatar profilePhotos bio avatarConfig"); // <-- Yahin par bhi check karein

    return res.status(200).json({ success: true, chat: fullChat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Reject Message Request
// @route PATCH /api/chats/:chatId/reject
exports.rejectRequest = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  try {
    const chat = await Chat.findById(chatId);
    if (chat && chat.requestedBy) {
      await Activity.findOneAndUpdate(
        { sender: chat.requestedBy, recipient: userId, type: "FOLLOW_REQUEST" },
        { status: "REJECTED", isRead: true },
        { upsert: true }
      );
    }
    await Chat.findByIdAndDelete(chatId);
    return res.status(200).json({ success: true, message: "Request rejected" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create Group Chat
// @route POST /api/chats/group
exports.createGroup = async (req, res) => {
  const { name, users, groupAvatar, description } = req.body;
  if (!name || !users) return res.status(400).json({ success: false, message: "Fields required" });

  let parsedUsers = users;
  if (typeof users === "string") {
    try {
      parsedUsers = JSON.parse(users);
    } catch {
      parsedUsers = [users];
    }
  }
  parsedUsers.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: name,
      groupName: name,
      groupAvatar: groupAvatar || "",
      groupDescription: description || "",
      isGroupChat: true,
      participants: parsedUsers,
      groupAdmin: req.user._id,
      groupAdmins: [req.user._id],
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("groupAdmin", "fullName username avatar avatarConfig")
      .populate("groupAdmins", "fullName username avatar avatarConfig");

    return res.status(201).json({ success: true, chat: fullGroupChat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Disappearing Messages Timer with Point-in-time Anchor
// @route PATCH /api/chats/:chatId/disappearing
exports.setDisappearingTimer = async (req, res) => {
  const { timer } = req.body;
  const validTimers = ["off", "after_view", "24h", "7d", "90d"];
  const chosenTimer = validTimers.includes(timer) ? timer : "off";

  try {
    const chat = await Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        disappearingTimer: chosenTimer,
        disappearingChangedBy: req.user._id,
        disappearingActivatedAt: chosenTimer !== "off" ? new Date() : null,
      },
      { new: true }
    ).populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen");

    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    let timerLabel = "turned off auto-delete messages";
    if (chosenTimer === "after_view") timerLabel = "enabled auto-delete on view (Messages disappear after viewing)";
    else if (chosenTimer === "24h") timerLabel = "set messages to disappear after 24 hours";
    else if (chosenTimer === "7d") timerLabel = "set messages to disappear after 7 days";
    else if (chosenTimer === "90d") timerLabel = "set messages to disappear after 90 days";

    const systemMsg = await Message.create({
      sender: req.user._id,
      chatId: chat._id,
      text: `⏱️ ${req.user.fullName || req.user.username} ${timerLabel}`,
      mediaType: "none",
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: systemMsg._id,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, chat, timer: chosenTimer, systemMessage: systemMsg });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Pin Chat
// @route PATCH /api/chats/:chatId/pin
exports.togglePinChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const userId = req.user._id;
    if (!chat.pinnedBy) chat.pinnedBy = [];
    const isPinned = chat.pinnedBy.some((id) => id && id.toString() === userId.toString());

    if (isPinned) chat.pinnedBy = chat.pinnedBy.filter((id) => id && id.toString() !== userId.toString());
    else chat.pinnedBy.push(userId);

    await chat.save();
    return res.status(200).json({ success: true, isPinned: !isPinned, message: !isPinned ? "Chat pinned 📌" : "Chat unpinned" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Favorite Chat (Star)
// @route PATCH /api/chats/:chatId/favorite
exports.toggleFavoriteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const userId = req.user._id;
    if (!chat.favoriteBy) chat.favoriteBy = [];
    const isFavorite = chat.favoriteBy.some((id) => id && id.toString() === userId.toString());

    if (isFavorite) {
      chat.favoriteBy = chat.favoriteBy.filter((id) => id && id.toString() !== userId.toString());
    } else {
      chat.favoriteBy.push(userId);
    }

    await chat.save();
    return res.status(200).json({
      success: true,
      isFavorite: !isFavorite,
      message: !isFavorite ? "Added to favorites ⭐" : "Removed from favorites",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Mute
// @route PATCH /api/chats/:chatId/mute
exports.toggleMute = async (req, res) => {
  const { duration } = req.body;
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    const userId = req.user._id;
    if (!chat.mutedUsers) chat.mutedUsers = [];
    chat.mutedUsers = chat.mutedUsers.filter((m) => m.userId && m.userId.toString() !== userId.toString());

    let isMuted = false;
    let muteDuration = "off";

    if (duration && duration !== "unmute") {
      let mutedUntil = null;
      const now = new Date();
      if (duration === "8h") mutedUntil = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      else if (duration === "24h") mutedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      chat.mutedUsers.push({ userId, duration, mutedUntil });
      isMuted = true;
      muteDuration = duration;
    }

    await chat.save();
    return res.status(200).json({ success: true, isMuted, muteDuration, message: isMuted ? "Muted" : "Chat unmuted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Group Members Management
// @route PATCH /api/chats/group/update/:chatId
exports.updateGroupInfo = async (req, res) => {
  const { name, description, groupAvatar } = req.body;
  try {
    const updates = {};
    if (name) {
      updates.chatName = name;
      updates.groupName = name;
    }
    if (description !== undefined) updates.groupDescription = description;
    if (groupAvatar !== undefined) updates.groupAvatar = groupAvatar;

    const chat = await Chat.findByIdAndUpdate(req.params.chatId, updates, { new: true })
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("groupAdmin", "fullName username avatar avatarConfig")
      .populate("groupAdmins", "fullName username avatar avatarConfig");

    return res.status(200).json({ success: true, chat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMember = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const chat = await Chat.findByIdAndUpdate(chatId, { $addToSet: { participants: userId } }, { new: true })
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("groupAdmin", "fullName username avatar avatarConfig")
      .populate("groupAdmins", "fullName username avatar avatarConfig");
    return res.status(200).json({ success: true, chat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const chat = await Chat.findByIdAndUpdate(chatId, { $pull: { participants: userId, groupAdmins: userId } }, { new: true })
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("groupAdmin", "fullName username avatar avatarConfig")
      .populate("groupAdmins", "fullName username avatar avatarConfig");
    return res.status(200).json({ success: true, chat, leftUserId: userId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleAdmin = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });

    if (!chat.groupAdmins) chat.groupAdmins = [];
    const isAdmin = chat.groupAdmins.some((a) => a && a.toString() === userId.toString());

    if (isAdmin) chat.groupAdmins = chat.groupAdmins.filter((a) => a && a.toString() !== userId.toString());
    else chat.groupAdmins.push(userId);

    await chat.save();
    const updatedChat = await Chat.findById(chatId)
      .populate("participants", "fullName username avatar profilePhotos avatarConfig isVIP isOnline bio lastSeen")
      .populate("groupAdmin", "fullName username avatar avatarConfig")
      .populate("groupAdmins", "fullName username avatar avatarConfig");

    return res.status(200).json({ success: true, chat: updatedChat });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};