const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Call = require("../models/Call");

const onlineUsers = new Map(); // userId -> Set of socketIds

const addOnlineSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeOnlineSocket = (userId, socketId) => {
  if (!onlineUsers.has(userId)) return;
  onlineUsers.get(userId).delete(socketId);
  if (onlineUsers.get(userId).size === 0) onlineUsers.delete(userId);
};

const isUserOnline = (userId) => onlineUsers.has(userId?.toString());
const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const activeCalls = new Map();

const setActiveCall = (userId, peerId, callId, chatId) => {
  activeCalls.set(userId, { peerId, callId, chatId });
  activeCalls.set(peerId, { peerId: userId, callId, chatId });
};

const clearActiveCall = (userId) => {
  const entry = activeCalls.get(userId);
  if (entry) {
    activeCalls.delete(entry.peerId);
    activeCalls.delete(userId);
  }
  return entry;
};

// Robust Auth Middleware supporting auth.token, headers, and query token
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1] ||
      socket.handshake.query?.token;

    if (!token) return next(new Error("Authentication error: token missing"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kafchat_master_secret");
    const user = await User.findById(decoded.id || decoded.userId || decoded._id).select("-password");
    if (!user) return next(new Error("Authentication error: user not found"));

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error: invalid or expired token"));
  }
};

const initSocket = (io) => {
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    const isGhost = Boolean(socket.user.isGhostModeActive);

    // 1. Online Presence Management
    addOnlineSocket(userId, socket.id);
    socket.join(userId);

    // Only broadcast & persist online status if user is NOT in Ghost Mode
    if (!isGhost) {
      User.findByIdAndUpdate(userId, { isOnline: true }).catch((err) =>
        console.error("Failed to set isOnline:", err)
      );

      io.emit("online_users", getOnlineUserIds());
      socket.broadcast.emit("user_online", { userId });
    }

    socket.on("user_online", () => {
      addOnlineSocket(userId, socket.id);
      if (!isGhost) {
        io.emit("online_users", getOnlineUserIds());
      }
    });

    // 2. Room Join / Leave
    socket.on("join_chat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId.toString());
    });

    socket.on("leave_chat", (chatId) => {
      if (!chatId) return;
      socket.leave(chatId.toString());
    });

    // 3. E2EE & Standard Message Forwarding
    socket.on("send_message", ({ chatId, message }) => {
      if (!chatId || !message) return;
      socket.to(chatId.toString()).emit("receive_message", message);
    });

    socket.on("send_e2ee_message", (messageData) => {
      if (!messageData?.chatId) return;
      io.to(messageData.chatId.toString()).emit("receive_e2ee_message", messageData);
    });

    // 4. Ghost Typing Toggle
    socket.on("typing", ({ chatId, isGhost: clientGhost }) => {
      if (!chatId || isGhost || clientGhost) return;
      socket.to(chatId.toString()).emit("typing", { chatId, userId, user: socket.user.username });
    });

    socket.on("stop_typing", ({ chatId }) => {
      if (!chatId) return;
      socket.to(chatId.toString()).emit("stop_typing", { chatId, userId });
    });

    // 5. Message Edit Broadcast
    socket.on("message_edited", ({ chatId, message }) => {
      if (!chatId || !message) return;
      io.to(chatId.toString()).emit("message_edited_update", { chatId, message });
    });

    // 6. Reactions Broadcast
    socket.on("message_reaction", ({ chatId, messageId, reactions }) => {
      if (!chatId || !messageId) return;
      io.to(chatId.toString()).emit("message_reaction_update", { messageId, reactions });
    });

    // 7. Delete Message Broadcast
    socket.on("message_deleted", ({ chatId, messageId, originalText }) => {
      if (!chatId || !messageId) return;
      io.to(chatId.toString()).emit("message_deleted", { messageId, chatId, originalText });
    });

    // 8. Read Receipt Sync
    socket.on("message_read", async ({ chatId, messageId, senderId }) => {
      try {
        if (!messageId) return;

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: userId, deliveredTo: userId },
        });

        const targetRoom = senderId ? senderId.toString() : chatId.toString();
        io.to(targetRoom).emit("message_read_update", {
          chatId,
          messageId,
          readBy: userId,
        });
      } catch (error) {
        console.error("message_read error:", error);
      }
    });

    // 9. Instant Snap Wipe
    socket.on("snap_cleanup_trigger", ({ chatId }) => {
      if (!chatId) return;
      io.to(chatId.toString()).emit("snap_messages_wiped", { chatId });
    });

    // 10. Screenshot Alert
    socket.on("screenshot_taken", ({ chatId, username }) => {
      if (!chatId) return;
      io.to(chatId.toString()).emit("screenshot_alert", {
        alertText: `📸 ${username || socket.user.username} took a screenshot!`,
        timestamp: new Date(),
      });
    });

    // 11. Listen Together (Music Sync)
    socket.on("music_sync_action", ({ roomId, trackId, timestamp, action }) => {
      if (!roomId) return;
      socket.to(roomId.toString()).emit("music_sync_update", {
        trackId,
        timestamp,
        action,
        serverTime: Date.now(),
      });
    });

    socket.on("music_sync_disconnect", ({ roomId, leftUsername }) => {
      if (!roomId) return;
      socket.to(roomId.toString()).emit("sync_partner_left", {
        alertText: `@${leftUsername || socket.user.username} left the session`,
      });
    });

    // 12. Remote Kill-Switch
    socket.on("trigger_remote_kill", ({ targetDeviceId }) => {
      if (!targetDeviceId) return;
      io.emit(`force_logout_${targetDeviceId}`, {
        reason: "Session terminated by Master Root device.",
      });
    });

    // 13. WebRTC Video & Audio Calls
    socket.on("call:invite", async ({ toUserId, chatId, callType, offer }) => {
      try {
        if (!toUserId || !chatId || !offer) return;

        if (activeCalls.has(toUserId.toString())) {
          socket.emit("call:busy", { toUserId });
          return;
        }
        if (!isUserOnline(toUserId)) {
          socket.emit("call:unavailable", { toUserId });
          return;
        }

        const call = await Call.create({
          chatId,
          caller: userId,
          receiver: toUserId,
          callType: callType === "video" ? "video" : "audio",
          status: "ongoing",
        });

        setActiveCall(userId, toUserId.toString(), call._id.toString(), chatId);

        io.to(toUserId.toString()).emit("call:incoming", {
          callId: call._id,
          chatId,
          callType: call.callType,
          offer,
          fromUser: {
            _id: socket.user._id,
            fullName: socket.user.fullName,
            username: socket.user.username,
            avatar: socket.user.avatar,
            profilePhotos: socket.user.profilePhotos,
          },
        });
      } catch (error) {
        console.error("call:invite error:", error);
        socket.emit("call:error", { message: "Couldn't start the call" });
      }
    });

    socket.on("call:answer", ({ toUserId, callId, answer }) => {
      if (!toUserId || !answer) return;
      io.to(toUserId.toString()).emit("call:answered", { callId, answer, fromUserId: userId });
    });

    socket.on("call:ice-candidate", ({ toUserId, candidate }) => {
      if (!toUserId || !candidate) return;
      io.to(toUserId.toString()).emit("call:ice-candidate", { candidate, fromUserId: userId });
    });

    socket.on("call:reject", async ({ toUserId, callId }) => {
      try {
        if (callId) {
          await Call.findByIdAndUpdate(callId, { status: "rejected", endedAt: new Date() });
        }
        clearActiveCall(userId);
        if (toUserId) io.to(toUserId.toString()).emit("call:rejected", { callId, fromUserId: userId });
      } catch (error) {
        console.error("call:reject error:", error);
      }
    });

    socket.on("call:end", async ({ toUserId, callId }) => {
      try {
        clearActiveCall(userId);
        if (callId) {
          const call = await Call.findById(callId);
          if (call && call.status === "ongoing") {
            const endedAt = new Date();
            const durationInSeconds = Math.max(
              0,
              Math.round((endedAt - call.startedAt) / 1000)
            );
            call.status = "completed";
            call.endedAt = endedAt;
            call.durationInSeconds = durationInSeconds;
            await call.save();
          }
        }
        if (toUserId) io.to(toUserId.toString()).emit("call:ended", { callId, fromUserId: userId });
      } catch (error) {
        console.error("call:end error:", error);
      }
    });

    // 14. Disconnect Handling
    socket.on("disconnect", async () => {
      removeOnlineSocket(userId, socket.id);

      const callEntry = clearActiveCall(userId);
      if (callEntry) {
        io.to(callEntry.peerId).emit("call:ended", {
          callId: callEntry.callId,
          fromUserId: userId,
          reason: "disconnected",
        });
        Call.findByIdAndUpdate(callEntry.callId, {
          status: "completed",
          endedAt: new Date(),
        }).catch(() => {});
      }

      if (!isUserOnline(userId)) {
        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        } catch (err) {
          console.error("Failed to set offline status:", err);
        }
        if (!isGhost) {
          socket.broadcast.emit("user_offline", { userId, lastSeen });
          io.emit("online_users", getOnlineUserIds());
        }
      }
    });
  });
};

module.exports = { initSocket, getOnlineUserIds, isUserOnline };