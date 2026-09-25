import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { chatService } from "../services/chatService";
import { messageService } from "../services/messageService";
import { getSocket } from "../services/socket";
import api from "../services/api";
import { encryptMessage, decryptMessage, initUserE2EEKeys } from "../utils/cryptoUtils";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated, setUser } = useContext(AuthContext);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeWallpaper, setActiveWallpaper] = useState("");

  const activeChatRef = useRef(activeChat);
  activeChatRef.current = activeChat;

  const currentUserId = (user?._id || user?.id)?.toString();
  const isVip = Boolean(user?.isVIP);

  // Initialize E2EE Keys on Device
  useEffect(() => {
    if (isAuthenticated && currentUserId) {
      initUserE2EEKeys(currentUserId);
    }
  }, [isAuthenticated, currentUserId]);

  // Load Chat List
  const refreshChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const { data } = await chatService.fetchChats();
      const chatList = data.chats || [];
      setChats(chatList);

      const counts = {};
      chatList.forEach((c) => {
        if (c.unreadCount) counts[c._id] = c.unreadCount;
      });
      setUnreadCounts(counts);
    } catch {
      toast.error("Couldn't load your chats");
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const fetchChats = refreshChats;

  useEffect(() => {
    if (isAuthenticated) refreshChats();
  }, [isAuthenticated, refreshChats]);

  // Snap Mode Cleanup (Only hides seen messages for current user when exiting chat)
  const triggerSnapCleanup = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      await api.post(`/chats/${chatId}/exit-cleanup`);
      const socket = getSocket();
      socket?.emit("snap_cleanup_trigger", { chatId });
    } catch (err) {
      console.error("Auto-delete exit cleanup error:", err);
    }
  }, []);

  const closeChat = useCallback(async () => {
    const current = activeChatRef.current;
    if (current && current.disappearingTimer === "after_view") {
      await triggerSnapCleanup(current._id);
      setMessages([]);
    }
    setActiveChat(null);
    setReplyingMessage(null);
    setActiveWallpaper("");
  }, [triggerSnapCleanup]);

  // Open Chat with E2EE Auto-Decryption & Mark Read Trigger
  const openChat = useCallback(
    async (chat) => {
      const previous = activeChatRef.current;
      if (previous && previous._id !== chat._id && previous.disappearingTimer === "after_view") {
        triggerSnapCleanup(previous._id);
      }

      setActiveChat(chat);
      setReplyingMessage(null);
      setSearchQuery("");
      setShowSearch(false);
      setLoadingMessages(true);

      const savedWp = localStorage.getItem(`chat_wallpaper_${chat._id}`) || "";
      setActiveWallpaper(savedWp);

      setUnreadCounts((prev) => ({ ...prev, [chat._id]: 0 }));
      setChats((prev) =>
        prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c))
      );

      const socket = getSocket();
      socket?.emit("join_chat", chat._id);

      try {
        const { data } = await messageService.getMessages(chat._id);
        const rawList = data.messages || [];

        const otherParticipant = chat.participants?.find(
          (p) => (p._id || p)?.toString() !== currentUserId
        );

        // Client-Side E2EE Decryption
        const decryptedList = await Promise.all(
          rawList.map(async (msg) => {
            if (msg.encryptedContent && msg.iv && otherParticipant?.publicKey) {
              const plain = await decryptMessage(
                msg.encryptedContent,
                msg.iv,
                currentUserId,
                otherParticipant.publicKey
              );
              return { ...msg, text: plain };
            }
            return msg;
          })
        );

        setMessages(decryptedList);

        // Explicitly trigger markRead when chat is opened so server updates readBy & blue ticks work
        if (messageService.markRead) {
          await messageService.markRead(chat._id);
        } else if (messageService.markAsRead) {
          await messageService.markAsRead(chat._id);
        }
      } catch (err) {
        console.error("Get messages error:", err);
        toast.error("Couldn't load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [triggerSnapCleanup, currentUserId]
  );

  const addBatchMessages = useCallback((newMessagesArray) => {
    if (!Array.isArray(newMessagesArray) || newMessagesArray.length === 0) return;
    setMessages((prev) => [...prev, ...newMessagesArray]);
    const lastMsg = newMessagesArray[newMessagesArray.length - 1];
    setChats((prev) =>
      prev
        .map((c) =>
          c._id === lastMsg.chatId ? { ...c, lastMessage: lastMsg, unreadCount: 0 } : c
        )
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  }, []);

  // Send Message with Pure E2EE Encryption
  const sendMessage = useCallback(
    async ({
      text,
      mediaUrl,
      mediaType,
      voiceDurationSec,
      voicePitchFX,
      waveformData,
      caption,
      pollData,
      isViewOnce,
    }) => {
      if (!activeChat) return;

      let encryptedContent = "";
      let iv = "";
      const otherParticipant = activeChat.participants?.find(
        (p) => (p._id || p)?.toString() !== currentUserId
      );

      // Perform E2EE Client-Side Encryption
      if (!activeChat.isGroupChat && otherParticipant?.publicKey && text) {
        const encrypted = await encryptMessage(text, currentUserId, otherParticipant.publicKey);
        if (encrypted && typeof encrypted === "object") {
          encryptedContent = encrypted.ciphertext;
          iv = encrypted.iv;
        }
      }

      try {
        // Agar chat temporary hai (jaise "temp_..."), toh recipientId bhi bhejna zaroori hai backend ke liye
        const isTempChat = activeChat.isTemp || activeChat._id?.toString().startsWith("temp_");
        const recipientId = isTempChat ? otherParticipant?._id?.toString() : null;

        const { data } = await messageService.sendMessage({
          chatId: isTempChat ? null : activeChat._id,
          recipientId,
          text: activeChat.isGroupChat ? text : encryptedContent ? "" : text,
          encryptedContent,
          iv,
          mediaUrl,
          mediaType: mediaType || "text",
          voiceDurationSec: voiceDurationSec || 0,
          voicePitchFX: voicePitchFX || "NORMAL",
          waveformData: waveformData || [],
          caption,
          pollData,
          isViewOnce: Boolean(isViewOnce),
          replyTo: replyingMessage ? replyingMessage._id : null,
        });

        const newMsg = { ...data.message, text };
        const realChatId = data.chatId; // Backend se jo real chat ID aayi hai

        setMessages((prev) => [...prev, newMsg]);
        setReplyingMessage(null);

        const socket = getSocket();
        socket?.emit("send_e2ee_message", {
          chatId: realChatId || activeChat._id,
          message: newMsg,
        });

        // Agar yeh pehla message tha (temp chat thi), toh activeChat ko real chat ID se update kar do
        if (isTempChat && realChatId) {
          const updatedChat = {
            ...activeChat,
            _id: realChatId,
            isTemp: false,
            requestStatus: "pending"
          };
          setActiveChat(updatedChat);
          setChats((prev) => [updatedChat, ...prev.filter(c => c._id !== activeChat._id)]);
        } else {
          setChats((prev) =>
            prev
              .map((c) =>
                c._id === activeChat._id ? { ...c, lastMessage: newMsg, unreadCount: 0 } : c
              )
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          );
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Message failed to send");
      }
    },
    [activeChat, replyingMessage, currentUserId]
  );

  // Edit Message (15-Minute Window Verification)
  const editMessage = useCallback(
    async (messageId, newText) => {
      try {
        let encryptedContent = "";
        let iv = "";
        const otherParticipant = activeChat?.participants?.find(
          (p) => (p._id || p)?.toString() !== currentUserId
        );

        if (!activeChat?.isGroupChat && otherParticipant?.publicKey && newText) {
          const encrypted = await encryptMessage(newText, currentUserId, otherParticipant.publicKey);
          if (encrypted && typeof encrypted === "object") {
            encryptedContent = encrypted.ciphertext;
            iv = encrypted.iv;
          }
        }

        const { data } = await api.patch(`/messages/${messageId}`, {
          text: activeChat?.isGroupChat ? newText : encryptedContent ? "" : newText,
          encryptedContent,
          iv,
        });

        if (data.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? { ...m, text: newText, isEdited: true } : m))
          );
          const socket = getSocket();
          socket?.emit("message_edited", {
            chatId: activeChat._id,
            message: { ...data.message, text: newText },
          });
          toast.success("Message edited");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to edit message");
      }
    },
    [activeChat, currentUserId]
  );

  const reactToMessage = useCallback(
    async (messageId, emoji) => {
      try {
        const targetMessage = messages.find((m) => m._id === messageId);
        const existingMyReaction = targetMessage?.reactions?.find(
          (r) => (r.user?._id || r.user)?.toString() === currentUserId && r.emoji === emoji
        );

        // Optimistic UI update for instant toggle
        let updatedReactions = [...(targetMessage?.reactions || [])];
        if (existingMyReaction) {
          updatedReactions = updatedReactions.filter(
            (r) => !((r.user?._id || r.user)?.toString() === currentUserId && r.emoji === emoji)
          );
        } else {
          updatedReactions = updatedReactions.filter(
            (r) => (r.user?._id || r.user)?.toString() !== currentUserId
          );
          updatedReactions.push({ user: currentUserId, emoji });
        }

        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: updatedReactions } : m))
        );

        const { data } = await api.post(`/messages/${messageId}/react`, { emoji });
        if (data && data.success) {
          const finalReactions = data.reactions || updatedReactions;
          setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? { ...m, reactions: finalReactions } : m))
          );
          const socket = getSocket();
          socket?.emit("message_reaction", {
            chatId: activeChat?._id,
            messageId,
            reactions: finalReactions,
          });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update reaction");
      }
    },
    [activeChat?._id, messages, currentUserId]
  );

  const votePoll = useCallback(
    async (messageId, optionIndex) => {
      try {
        const { data } = await api.patch(`/messages/${messageId}/vote`, { optionIndex });
        if (data.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? { ...m, pollData: data.pollData } : m))
          );
          const socket = getSocket();
          socket?.emit("poll_voted", {
            chatId: activeChat?._id,
            messageId,
            pollData: data.pollData,
          });
        }
      } catch {
        toast.error("Failed to submit vote");
      }
    },
    [activeChat?._id]
  );

  const togglePinMessage = useCallback(async (messageId) => {
    try {
      const { data } = await api.patch(`/messages/${messageId}/pin`);
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isPinned: data.isPinned } : m))
        );
        toast.success(data.isPinned ? "Message pinned" : "Message unpinned");
      }
    } catch {
      toast.error("Failed to pin message");
    }
  }, []);

  const updateGroupInfo = useCallback(async (chatId, updateData) => {
    try {
      const { data } = await chatService.updateGroupInfo(chatId, updateData);
      setActiveChat((prev) => (prev?._id === chatId ? { ...prev, ...data.chat } : prev));
      setChats((prev) => prev.map((c) => (c._id === chatId ? { ...c, ...data.chat } : c)));
      toast.success("Group info updated");
    } catch {
      toast.error("Failed to update group");
    }
  }, []);

  const removeGroupMember = useCallback(async (chatId, userIdToRemove) => {
    try {
      await chatService.removeMember(chatId, userIdToRemove);
      setActiveChat((prev) =>
        prev?._id === chatId
          ? {
              ...prev,
              participants: prev.participants.filter(
                (p) => (p._id || p)?.toString() !== userIdToRemove
              ),
            }
          : prev
      );
      toast.success("Member removed from group");
    } catch {
      toast.error("Failed to remove member");
    }
  }, []);

  // 🔒 Direct Chat Lock Execution (Supports Dynamic Verification)
  const toggleLock = useCallback(
    async (chatId, pin) => {
      try {
        const { data } = await chatService.toggleLock(chatId, pin);
        if (data.success) {
          toast.success(data.message || (data.isLocked ? "Chat locked 🔒" : "Chat unlocked 🔓"));

          setUser((prev) => ({ ...prev, lockPin: pin }));

          setActiveChat((prev) =>
            prev?._id === chatId ? { ...prev, isLocked: data.isLocked } : prev
          );

          setChats((prev) =>
            prev.map((c) => (c._id === chatId ? { ...c, isLocked: data.isLocked } : c))
          );

          return true;
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Invalid PIN passcode");
        return false;
      }
    },
    [setUser]
  );

  // Clear Chat Messages
  const clearChat = useCallback(async (chatId) => {
    const targetChatId = chatId || activeChatRef.current?._id;
    if (!targetChatId) return;
    try {
      await chatService.clearChat(targetChatId);
      setMessages([]);
      setChats((prev) =>
        prev.map((c) =>
          c._id === targetChatId ? { ...c, lastMessage: null, unreadCount: 0 } : c
        )
      );
      toast.success("All messages cleared");
    } catch {
      toast.error("Failed to clear chat");
    }
  }, []);

  // Delete Conversation Thread
  const deleteConversation = useCallback(async (chatId) => {
    const targetChatId = chatId || activeChatRef.current?._id;
    if (!targetChatId) return;
    try {
      await chatService.deleteConversation(targetChatId);
      if (activeChatRef.current?._id === targetChatId) {
        setActiveChat(null);
        setMessages([]);
      }
      setChats((prev) => prev.filter((c) => c._id !== targetChatId));
      toast.success("Conversation deleted");
    } catch {
      toast.error("Failed to delete conversation");
    }
  }, []);

  // Socket Listeners & Real-Time Handlers
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const onOnlineUsers = (ids) => setOnlineUserIds(ids);

    const onReceiveE2EEMessage = async (payload) => {
      const incomingMsg = payload.message || payload;
      const current = activeChatRef.current;
      const isCurrentChat = current && incomingMsg.chatId === current._id;

      let displayText = incomingMsg.text;

      if (incomingMsg.encryptedContent && incomingMsg.iv) {
        const senderPublic = incomingMsg.sender?.publicKey;
        if (senderPublic) {
          displayText = await decryptMessage(
            incomingMsg.encryptedContent,
            incomingMsg.iv,
            currentUserId,
            senderPublic
          );
        }
      }

      const finalizedMessage = { ...incomingMsg, text: displayText };

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === finalizedMessage._id)) return prev;
          return [...prev, finalizedMessage];
        });
        if (messageService.markRead) messageService.markRead(current._id).catch(() => {});
      }

      setUnreadCounts((prev) => ({
        ...prev,
        [finalizedMessage.chatId]: isCurrentChat ? 0 : (prev[finalizedMessage.chatId] || 0) + 1,
      }));

      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === finalizedMessage.chatId);
        if (idx === -1) {
          refreshChats();
          return prev;
        }

        const updated = [...prev];
        const targetChat = updated[idx];
        const newUnread = isCurrentChat ? 0 : (targetChat.unreadCount || 0) + 1;

        updated[idx] = {
          ...targetChat,
          lastMessage: finalizedMessage,
          unreadCount: newUnread,
        };

        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const onMessageDeleted = ({ messageId, originalText }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            return {
              ...m,
              deletedForEveryone: true,
              isAntiDeleteRecovered: isVip,
              text: isVip ? (originalText || m.text) : "This message was deleted",
            };
          }
          return m;
        })
      );
    };

    const onNewGroupCreated = ({ chat }) => {
      setChats((prev) => [chat, ...prev]);
      toast.success(`You were added to "${chat.chatName}"! 🎉`);
    };

    const onScreenshotAlert = ({ alertText }) => {
      toast(alertText, { icon: "📸", duration: 4000 });
    };

    const onMessageEditedUpdate = ({ message }) => {
      if (activeChatRef.current?._id === message.chatId) {
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
      }
    };

    const onMessageReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const onPollVotedUpdate = ({ messageId, pollData }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, pollData } : m))
      );
    };

    const onSnapWiped = ({ chatId }) => {
      if (activeChatRef.current?._id === chatId) {
        messageService.getMessages(chatId).then(({ data }) => {
          setMessages(data.messages || []);
        });
      }
      refreshChats();
    };

    const onTyping = ({ chatId, user: typingUsername }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: [...new Set([...(prev[chatId] || []), typingUsername])],
      }));
    };

    const onStopTyping = ({ chatId, userId: stopUserId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter((u) => u !== stopUserId),
      }));
    };

    socket.on("online_users", onOnlineUsers);
    socket.on("receive_e2ee_message", onReceiveE2EEMessage);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("new_group_created", onNewGroupCreated);
    socket.on("screenshot_alert", onScreenshotAlert);
    socket.on("message_edited_update", onMessageEditedUpdate);
    socket.on("message_reaction_update", onMessageReactionUpdate);
    socket.on("poll_voted_update", onPollVotedUpdate);
    socket.on("snap_messages_wiped", onSnapWiped);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);

    return () => {
      socket.off("online_users", onOnlineUsers);
      socket.off("receive_e2ee_message", onReceiveE2EEMessage);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("new_group_created", onNewGroupCreated);
      socket.off("screenshot_alert", onScreenshotAlert);
      socket.off("message_edited_update", onMessageEditedUpdate);
      socket.off("message_reaction_update", onMessageReactionUpdate);
      socket.off("poll_voted_update", onPollVotedUpdate);
      socket.off("snap_messages_wiped", onSnapWiped);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
    };
  }, [isAuthenticated, refreshChats, currentUserId, isVip]);

  const startChatWithUser = useCallback(
    async (otherUserId) => {
      try {
        const { data } = await chatService.accessChat(otherUserId);
        
        if (!data.chat) {
          // Agar chat pehle se nahi hai, toh ek temporary/draft chat object bana lo 
          // jisse bina error ke message box khul jaye aur pehla message bhejte hi chat create ho jaye.
          const tempChat = {
            _id: null, // ID null rahegi taaki messages fetch API call na ho
            participants: [currentUserId, otherUserId],
            requestStatus: "pending",
            isDraft: true
          };
          setActiveChat(tempChat);
          setMessages([]);
          return tempChat;
        }

        const newChat = data.chat;
        setChats((prev) => {
          const exists = prev.some((c) => c._id === newChat._id);
          return exists ? prev : [newChat, ...prev];
        });
        await openChat(newChat);
        return newChat;
      } catch (err) {
        toast.error(err.response?.data?.message || "Couldn't start chat");
      }
    },
    [openChat, currentUserId]
  );

  const acceptRequest = useCallback(async (chatId) => {
    try {
      const { data } = await chatService.acceptRequest(chatId);
      const updatedChat = data.chat || data;
      setActiveChat((prev) => (prev?._id === chatId ? updatedChat : prev));
      setChats((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, requestStatus: "accepted", ...updatedChat } : c
        )
      );
      toast.success("Request accepted!");
      return updatedChat;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept request");
      throw err;
    }
  }, []);

  const rejectRequest = useCallback(async (chatId) => {
    try {
      await chatService.rejectRequest(chatId);
      setActiveChat((prev) => (prev?._id === chatId ? null : prev));
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      toast.success("Request rejected");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
      throw err;
    }
  }, []);

  const createGroup = useCallback(
    async ({ name, users, groupAvatar, description }) => {
      try {
        const { data } = await chatService.createGroup({ name, users, groupAvatar, description });
        setChats((prev) => [data.chat, ...prev]);
        await openChat(data.chat);
        toast.success(`Group "${name}" created! 🎉`);
        return data.chat;
      } catch (err) {
        toast.error(err.response?.data?.message || "Couldn't create group");
        throw err;
      }
    },
    [openChat]
  );

  const deleteMessage = useCallback(async (messageId, forEveryone = false) => {
    try {
      await messageService.deleteMessage(messageId, forEveryone);
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId) {
            if (forEveryone && isVip) {
              return {
                ...m,
                deletedForEveryone: true,
                isAntiDeleteRecovered: true,
              };
            }
            return forEveryone
              ? { ...m, deletedForEveryone: true, text: "This message was deleted" }
              : null;
          }
          return m;
        }).filter(Boolean)
      );
    } catch {
      toast.error("Failed to delete");
    }
  }, [isVip]);

  const emitTyping = useCallback(
    (isGhost = false) => {
      if (activeChat) getSocket()?.emit("typing", { chatId: activeChat._id, isGhost });
    },
    [activeChat]
  );

  const emitStopTyping = useCallback(() => {
    if (activeChat) getSocket()?.emit("stop_typing", { chatId: activeChat._id });
  }, [activeChat]);

  const value = useMemo(
    () => ({
      chats,
      setChats,
      activeChat,
      setActiveChat,
      closeChat,
      messages,
      setMessages,
      onlineUserIds,
      unreadCounts,
      typingUsers: activeChat ? typingUsers[activeChat._id] || [] : [],
      loadingChats,
      loadingMessages,
      replyingMessage,
      setReplyingMessage,
      searchQuery,
      setSearchQuery,
      showSearch,
      setShowSearch,
      activeWallpaper,
      refreshChats,
      fetchChats,
      openChat,
      startChatWithUser,
      acceptRequest,
      rejectRequest,
      createGroup,
      sendMessage,
      addBatchMessages,
      editMessage,
      deleteMessage,
      reactToMessage,
      votePoll,
      togglePinMessage,
      updateGroupInfo,
      removeGroupMember,
      toggleLock,
      clearChat,
      deleteConversation,
      emitTyping,
      emitStopTyping,
      isUserOnline: (id) => onlineUserIds.includes(id),
      currentUserId,
      isVip,
    }),
    [
      chats,
      activeChat,
      closeChat,
      messages,
      onlineUserIds,
      unreadCounts,
      typingUsers,
      loadingChats,
      loadingMessages,
      replyingMessage,
      searchQuery,
      showSearch,
      activeWallpaper,
      refreshChats,
      fetchChats,
      openChat,
      startChatWithUser,
      acceptRequest,
      rejectRequest,
      createGroup,
      sendMessage,
      addBatchMessages,
      editMessage,
      deleteMessage,
      reactToMessage,
      votePoll,
      togglePinMessage,
      updateGroupInfo,
      removeGroupMember,
      toggleLock,
      clearChat,
      deleteConversation,
      emitTyping,
      emitStopTyping,
      currentUserId,
      isVip,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};