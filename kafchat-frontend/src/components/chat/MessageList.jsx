import { useState, useRef, useEffect } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiCornerUpLeft,
  FiSmile,
  FiMoreVertical,
  FiTrash2,
  FiCopy,
  FiStar,
  FiDownload,
  FiFileText,
  FiMusic,
  FiCloud,
  FiClock,
  FiEdit2,
  FiX,
  FiLock,
  FiShare2,
  FiPlay,
  FiAtSign,
  FiInfo,
  FiBookmark,
  FiPlus,
  FiBarChart2,
} from "react-icons/fi";
import EmojiPicker, { Theme } from "emoji-picker-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import toast from "react-hot-toast";

const DEFAULT_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "🙏"];

const MessageList = ({ messages = [], loading, activeChat, typingUsers }) => {
  const { user } = useAuth();
  const {
    setReplyingMessage,
    reactToMessage,
    votePoll,
    deleteMessage,
    editMessage,
    togglePinMessage,
    onlineUserIds = [],
    isVip,
    socket,
  } = useChat();

  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [showFullEmojiPickerMsgId, setShowFullEmojiPickerMsgId] = useState(null);
  const [pollModalMsg, setPollModalMsg] = useState(null); // 📊 Poll Results Modal state
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [editModalMsg, setEditModalMsg] = useState(null);
  const [infoModalMsg, setInfoModalMsg] = useState(null);
  const [editText, setEditText] = useState("");

  const menuContainerRef = useRef(null);
  const currentUserId = (user?._id || user?.id)?.toString();
  const isSelfChat = Boolean(activeChat?.isSelfChat);
  const isSavedCloud = Boolean(activeChat?.isSavedCloud);
  const isGroup = Boolean(activeChat?.isGroupChat);
  const currentUserIsVIP = Boolean(user?.isVIP || isVip);

  const longPressTimer = useRef(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const [slidingMsgId, setSlidingMsgId] = useState(null);
  const [slideOffset, setSlideOffset] = useState(0);

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setActiveMenuMsgId(null);
        setActiveReactionMsgId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const activeSocket = socket || window.socket;
    if (!activeSocket) return;

    const handleScreenshotAlert = (data) => {
      if (data?.alertText && currentUserIsVIP) {
        toast(data.alertText, {
          icon: '🚨',
          duration: 5000,
          style: {
            background: '#121212',
            color: '#ff4b4b',
            border: '1px solid rgba(255, 75, 75, 0.4)',
            fontSize: '12px',
            fontWeight: 'bold',
          },
        });
      }
    };

    activeSocket.on("screenshot_alert", handleScreenshotAlert);
    return () => {
      activeSocket.off("screenshot_alert", handleScreenshotAlert);
    };
  }, [activeChat?._id, user?.username, currentUserIsVIP, socket]);

  const handleTouchStart = (msgId, e) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    touchCurrentX.current = touchStartX.current;
    setSlidingMsgId(msgId);

    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setActiveMenuMsgId(msgId);
      setActiveReactionMsgId(null);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (e) => {
    touchCurrentX.current = e.touches ? e.touches[0].clientX : e.clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    if (Math.abs(diff) <= 80) {
      setSlideOffset(diff);
    }
  };

  const handleTouchEnd = (msg) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    const diff = touchCurrentX.current - touchStartX.current;
    
    if (Math.abs(diff) > 50) {
      setReplyingMessage(msg);
      if (navigator.vibrate) navigator.vibrate(30);
    }
    setSlidingMsgId(null);
    setSlideOffset(0);
    touchStartX.current = 0;
    touchCurrentX.current = 0;
  };

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-400");
      setTimeout(() => el.classList.remove("ring-2", "ring-amber-400"), 1500);
    }
  };

  const handleOpenStoryContext = (statusId) => {
    if (!statusId) return;
    window.dispatchEvent(
      new CustomEvent("open_story_context", {
        detail: { storyId: statusId },
      })
    );
  };

  const handleTriggerReshare = (storyContext) => {
    if (!storyContext) return;
    window.dispatchEvent(
      new CustomEvent("reshare_story_to_modal", {
        detail: { storyContext },
      })
    );
  };

  const renderReadReceiptTicks = (msg) => {
    if (isSelfChat || isSavedCloud) {
      return (
        <span className="flex items-center text-[#53bdeb] font-bold ml-1 text-xs" title="Saved & Synced">
          <FiCheck className="-mr-1.5 stroke-[2.5]" size={13} />
          <FiCheck className="stroke-[2.5]" size={13} />
        </span>
      );
    }

    const readList = msg.readBy || [];
    
    // Safely extract user ID whether readBy contains Objects or simple IDs
    const isReadByOther = readList.some((item) => {
      const readUserId = (item?.user?._id || item?.user || item)?.toString();
      return readUserId && readUserId !== currentUserId;
    });

    if (isReadByOther) {
      return (
        <span className="flex items-center text-[#53bdeb] font-extrabold ml-1 text-xs" title="Read">
          <FiCheck className="-mr-1.5 stroke-[2.8]" size={13} />
          <FiCheck className="stroke-[2.8]" size={13} />
        </span>
      );
    }

    const otherParticipant = activeChat?.participants?.find(
      (p) => (p?._id || p)?.toString() !== currentUserId
    );
    const otherUserId = (otherParticipant?._id || otherParticipant)?.toString();
    const isReceiverOnline = onlineUserIds.includes(otherUserId);

    const deliveredList = msg.deliveredTo || [];
    const isDeliveredToOther = deliveredList.some((d) => {
      const dUserId = (d?._id || d)?.toString();
      return dUserId && dUserId !== currentUserId;
    });

    if (isReceiverOnline || isDeliveredToOther || (msg.deliveredTo && msg.deliveredTo.length > 0)) {
      return (
        <span className="flex items-center text-slate-300 opacity-95 ml-1 text-xs font-semibold" title="Delivered">
          <FiCheck className="-mr-1.5 stroke-[2.2]" size={13} />
          <FiCheck className="stroke-[2.2]" size={13} />
        </span>
      );
    }

    return (
      <span className="flex items-center text-slate-300 opacity-90 ml-1 text-xs font-semibold" title="Sent">
        <FiCheck className="stroke-[2.2]" size={13} />
      </span>
    );
  };

  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard 📋");
    }
    setActiveMenuMsgId(null);
  };

  const handleDeleteConfirm = async (forEveryone) => {
    if (!deleteModalMsg) return;
    try {
      if (deleteMessage) {
        await deleteMessage(deleteModalMsg._id, forEveryone);
        toast.success(forEveryone ? "Message deleted for everyone" : "Message deleted for you");
      }
      setDeleteModalMsg(null);
      setActiveMenuMsgId(null);
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim() || !editModalMsg) return;
    try {
      await editMessage(editModalMsg._id, editText.trim());
      setEditModalMsg(null);
      setEditText("");
      setActiveMenuMsgId(null);
    } catch {
      toast.error("Failed to edit message");
    }
  };

  const handleReactionClick = (msg, emoji) => {
    if (reactToMessage) {
      reactToMessage(msg._id, emoji);
    }
    if (!msg.reactions) msg.reactions = [];
    const existingIndex = msg.reactions.findIndex(
      (r) => (r.user?._id || r.user)?.toString() === currentUserId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      msg.reactions.splice(existingIndex, 1);
    } else {
      msg.reactions = msg.reactions.filter(
        (r) => (r.user?._id || r.user)?.toString() !== currentUserId
      );
      msg.reactions.push({ user: currentUserId, emoji });
    }

    setActiveMenuMsgId(null);
    setActiveReactionMsgId(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 theme-accent-border border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-14 h-14 rounded-2xl theme-accent-tint flex items-center justify-center text-2xl mb-3 shadow-inner">
          🔒
        </div>
        <p className="text-sm font-semibold theme-text">Messages are End-to-End Encrypted</p>
      </div>
    );
  }

  const activeMenuMessage = messages.find((m) => m._id === activeMenuMsgId);
  const isMenuMessageMe = activeMenuMessage && (activeMenuMessage.sender?._id || activeMenuMessage.sender)?.toString() === currentUserId;

  const activePinnedMsg = pinnedMessages.length > 0 ? pinnedMessages[currentPinnedIndex % pinnedMessages.length] : null;

  return (
    <div className="flex flex-col gap-2 p-2 relative z-0" ref={menuContainerRef}>
      {/* 📌 TELEGRAM STYLE PINNED MESSAGE BANNER */}
      {activePinnedMsg && (
        <div
          onClick={() => scrollToMessage(activePinnedMsg._id)}
          className="sticky top-0 z-10 mx-auto w-full max-w-md theme-panel-bg/90 backdrop-blur-md border theme-border rounded-2xl px-3 py-1.5 shadow-md flex items-center justify-between gap-2 cursor-pointer hover:theme-soft-bg transition animate-fadeIn mb-2"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <FiBookmark size={14} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-amber-400">Pinned Message</span>
                {pinnedMessages.length > 1 && (
                  <span className="text-[9px] theme-text-muted font-mono">
                    ({currentPinnedIndex + 1}/{pinnedMessages.length})
                  </span>
                )}
              </div>
              <p className="text-xs theme-text truncate">
                {activePinnedMsg.text || (activePinnedMsg.mediaType === "poll" ? "📊 Poll" : `📎 ${activePinnedMsg.mediaType || "Media"}`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {pinnedMessages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPinnedIndex((prev) => (prev + 1) % pinnedMessages.length);
                }}
                className="p-1 rounded-lg theme-soft-bg theme-text-muted hover:theme-text text-[10px] font-bold px-1.5 cursor-pointer"
                title="Next Pinned"
              >
                Next
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePinMessage(activePinnedMsg._id);
              }}
              className="p-1 theme-text-muted hover:text-red-400 rounded-lg cursor-pointer"
              title="Unpin"
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center my-1">
        <span className="px-3 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-400 flex items-center gap-1.5 shadow-sm">
          <FiLock size={10} className="text-amber-400" /> End-to-End Encrypted
        </span>
      </div>

      {messages.map((msg) => {
        const isMe = (msg.sender?._id || msg.sender)?.toString() === currentUserId;
        const isHovered = hoveredMsgId === msg._id;
        const isReactionOpen = activeReactionMsgId === msg._id;
        const isCurrentSliding = slidingMsgId === msg._id;

        if (msg.text && msg.text.startsWith("⏱️")) {
          return (
            <div key={msg._id} className="flex justify-center my-1.5">
              <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 shadow-sm flex items-center gap-1.5 text-center max-w-[85%]">
                <FiClock className="text-sky-400 shrink-0" size={11} />
                <span>{msg.text}</span>
              </div>
            </div>
          );
        }

        if (msg.deletedForEveryone) {
          if (currentUserIsVIP || msg.isAntiDeleteRecovered) {
            return (
              <div
                key={msg._id}
                id={`msg-${msg._id}`}
                onMouseEnter={() => setHoveredMsgId(msg._id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                className={`flex flex-col my-1 relative group ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="max-w-[75%] px-3 py-2 rounded-2xl bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 border border-pink-500/30 text-xs text-white flex flex-col gap-1 shadow-md relative">
                  <span className="text-[9px] font-bold text-pink-400 flex items-center gap-1">
                    <FiTrash2 size={10} /> 👑 VIP Recovered:
                  </span>
                  <p className="line-through text-slate-300 opacity-90">{msg.text || "Original message content"}</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg._id}
              id={`msg-${msg._id}`}
              onMouseEnter={() => setHoveredMsgId(msg._id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              className={`flex flex-col my-1 relative group ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="max-w-[75%] px-3 py-1.5 rounded-xl bg-gray-500/10 border border-gray-500/20 text-xs italic text-gray-400 flex items-center gap-1.5">
                <FiTrash2 size={12} />
                <span>This message was deleted</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={msg._id}
            id={`msg-${msg._id}`}
            onMouseEnter={() => setHoveredMsgId(msg._id)}
            onMouseLeave={() => setHoveredMsgId(null)}
            onTouchStart={(e) => handleTouchStart(msg._id, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(msg)}
            style={{
              transform: isCurrentSliding ? `translateX(${slideOffset}px)` : "translateX(0px)",
              transition: isCurrentSliding ? "none" : "transform 0.2s ease-out",
            }}
            className={`flex flex-col group relative select-none ${isMe ? "items-end" : "items-start"}`}
          >
            {activeChat?.isGroupChat && !isMe && msg.sender?.fullName && (
              <span className="text-[10px] font-semibold theme-accent-text ml-10 mb-0.5">
                {msg.sender.fullName}
              </span>
            )}

            <div className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              {!isMe && (
                <Avatar
                  src={msg.sender?.avatar}
                  alt={msg.sender?.fullName}
                  size="xs"
                  className="shrink-0 mb-1"
                />
              )}

              <div
                className={`relative px-3 py-2 rounded-2xl text-xs sm:text-sm shadow-sm transition-all min-w-0 ${
                  isMe
                    ? "theme-accent-bg text-white rounded-br-xs"
                    : "theme-soft-bg theme-text rounded-bl-xs border theme-border"
                }`}
              >
                {msg.isPinned && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 mb-0.5">
                    <FiStar size={10} />
                    <span>Pinned Message</span>
                  </div>
                )}

                {msg.storyContext && (
                  <div className="mb-1 w-44 rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-sm flex flex-col select-none">
                    <div
                      onClick={() => handleOpenStoryContext(msg.storyContext.statusId)}
                      className="flex items-center gap-1.5 p-1.5 cursor-pointer hover:bg-white/5 transition"
                    >
                      <div
                        className="w-9 h-9 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-center border border-white/10"
                        style={{
                          backgroundColor:
                            msg.storyContext.mediaType === "text"
                              ? msg.storyContext.backgroundColor || "#0284C7"
                              : "#000000",
                        }}
                      >
                        {msg.storyContext.mediaType === "text" ? (
                          <span
                            className="text-[7px] font-bold line-clamp-2 px-0.5"
                            style={{ color: msg.storyContext.textColor || "#ffffff" }}
                          >
                            {msg.storyContext.text}
                          </span>
                        ) : msg.storyContext.mediaUrl ? (
                          <img
                            src={msg.storyContext.mediaUrl}
                            alt="Story"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiPlay size={9} className="text-white" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1 leading-tight">
                        <span className="text-[9px] font-bold text-pink-400 flex items-center gap-0.5 truncate">
                          <FiAtSign size={8} /> Story Mention
                        </span>
                        <span className="text-[8px] text-white/60 font-mono truncate">
                          Tap to view
                        </span>
                      </div>
                    </div>

                    {msg.storyContext?.canReshare && !isMe && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerReshare(msg.storyContext);
                        }}
                        className="w-full py-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 active:scale-95 text-white font-bold text-[9px] flex items-center justify-center gap-1 transition border-t border-white/10 cursor-pointer"
                      >
                        <FiShare2 size={9} />
                        <span>Add to your story</span>
                      </button>
                    )}
                  </div>
                )}

                {msg.replyTo && (
                  <div
                    className={`p-1.5 rounded-lg mb-1 text-xs border-l-2 ${
                      isMe
                        ? "bg-black/20 text-white border-white/80"
                        : "theme-panel-bg theme-text-muted theme-accent-border"
                    }`}
                  >
                    <span className="font-bold block text-[9px]">
                      {msg.replyTo.sender?.fullName || "User"}
                    </span>
                    <p className="truncate opacity-90 text-[10px]">
                      {msg.replyTo.text || (msg.replyTo.mediaType === "poll" ? "📊 Poll" : `📎 ${msg.replyTo.mediaType || "Media"}`)}
                    </p>
                  </div>
                )}

                {msg.mediaUrl && msg.mediaType === "image" && !msg.storyContext && (
                  <div className="rounded-xl overflow-hidden my-1 max-w-[240px] sm:max-w-[280px] max-h-60 bg-black/10 flex items-center justify-center">
                    <img
                      src={msg.mediaUrl}
                      alt="Shared Media"
                      className="rounded-xl w-auto h-auto max-w-full max-h-80 object-contain cursor-pointer hover:opacity-95 transition"
                      onClick={() => window.open(msg.mediaUrl, "_blank")}
                    />
                  </div>
                )}

                {msg.mediaUrl && msg.mediaType === "video" && !msg.storyContext && (
                  <div className="rounded-xl overflow-hidden my-1 max-w-[240px] sm:max-w-[280px] max-h-70 bg-black flex items-center justify-center">
                    <video src={msg.mediaUrl} controls className="w-full max-h-80 rounded-xl object-contain" />
                  </div>
                )}

                {msg.mediaUrl && msg.mediaType === "audio" && (
                  <div className="flex items-center gap-2 p-0.5 my-0.5">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <FiMusic size={13} />
                    </div>
                    <audio controls src={msg.mediaUrl} className="w-44 sm:w-52 h-7" />
                  </div>
                )}

                {msg.mediaUrl && msg.mediaType === "document" && (
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 my-1 ${
                      isMe ? "bg-black/20 border-white/20" : "theme-panel-bg theme-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                        {msg.isVaultFile ? <FiCloud size={16} /> : <FiFileText size={16} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold truncate max-w-[120px] sm:max-w-[170px]">
                          {msg.fileName || "Document.pdf"}
                        </span>
                        <span className="text-[9px] opacity-75 font-mono">
                          {msg.fileSizeFormatted || "File"}
                        </span>
                      </div>
                    </div>
                    <a
                      href={msg.mediaUrl}
                      download={msg.fileName || "file"}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-1.5 rounded-lg transition ${
                        isMe
                          ? "bg-white/20 hover:bg-white/30 text-white"
                          : "theme-soft-bg hover:theme-accent-text theme-text"
                      }`}
                      title="Download"
                    >
                      <FiDownload size={14} />
                    </a>
                  </div>
                )}

                {/* POLL RENDERING WITH VIEW VOTES TRIGGER */}
                {msg.mediaType === "poll" && msg.pollData && (
  <div className="flex flex-col gap-1.5 min-w-[210px] p-2 rounded-xl bg-black/10 border border-white/10 my-1">
    <div className="flex items-center justify-between">
      <span className="font-bold text-xs tracking-wide block theme-text">
        {msg.pollData.question}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPollModalMsg(msg);
        }}
        className="p-1.5 rounded-xl theme-soft-bg hover:opacity-80 text-[10px] font-semibold flex items-center gap-1 cursor-pointer theme-text border theme-border shadow-xs"
        title="View Poll Results"
      >
        <FiBarChart2 size={12} className="theme-accent-text" /> 
        <span>View Votes</span>
      </button>
    </div>

    <div className="flex flex-col gap-1 mt-0.5">
      {msg.pollData.options?.map((opt, idx) => {
        const totalVotes = msg.pollData.options.reduce(
          (acc, o) => acc + (o.votes?.length || 0),
          0
        );
        const votesCount = opt.votes?.length || 0;
        const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
        
        // Check if current user has voted on ANY option in this poll
        const hasVotedThisOption = opt.votes?.some((v) => (v?._id || v)?.toString() === currentUserId);
        const hasVotedAnyOption = msg.pollData.options.some((o) =>
          o.votes?.some((v) => (v?._id || v)?.toString() === currentUserId)
        );

        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // Agar user pehle hi vote kar chuka hai, toh dubara click karke change hone se roko
              if (hasVotedAnyOption) {
                toast.error("You have already voted in this poll!");
                return;
              }
              if (votePoll) votePoll(msg._id, idx);
            }}
            className={`relative p-2 rounded-lg text-left text-xs font-medium flex items-center justify-between border transition overflow-hidden cursor-pointer ${
              hasVotedThisOption
                ? "bg-sky-500/25 border-sky-400 font-semibold theme-text"
                : "bg-black/15 border-white/15 hover:bg-black/25 theme-text"
            }`}
          >
            <div
              className="absolute inset-y-0 left-0 bg-sky-500/30 transition-all duration-300 pointer-events-none"
              style={{ width: `${percentage}%` }}
            />
            <div className="relative flex items-center justify-between z-10 w-full">
              <span className="flex items-center gap-1 truncate">
                {hasVotedThisOption && <FiCheckCircle className="text-sky-400 shrink-0" size={12} />}
                {opt.text}
              </span>
              <span className="text-[9px] font-bold opacity-85 font-mono ml-2 shrink-0">
                {votesCount} ({percentage}%)
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
)}

                {msg.text && !msg.storyContext && (
                  <p className="whitespace-pre-wrap break-all [overflow-wrap:anywhere] leading-relaxed">{msg.text}</p>
                )}

                <div className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${isMe ? "text-white/90" : "theme-text-muted"}`}>
                  {msg.isEdited && <span className="italic text-[8px] opacity-80">(edited)</span>}
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMe && renderReadReceiptTicks(msg)}
                </div>

                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`absolute -bottom-2.5 px-1.5 py-0.5 rounded-full theme-panel-bg border theme-border shadow-sm flex items-center gap-0.5 text-[9px] ${isMe ? "left-2" : "right-2"}`}>
                    {msg.reactions.map((r, i) => (
                      <span key={i}>{r.emoji}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS (Hover) */}
              {isHovered && !isReactionOpen && (
                <div className="flex items-center gap-0.5 theme-panel-bg border theme-border rounded-xl p-0.5 shadow-xl z-10 relative">
                  <button
                    type="button"
                    onClick={() => setReplyingMessage(msg)}
                    className="p-1 rounded-lg theme-text-muted hover:theme-accent-text transition cursor-pointer"
                    title="Reply"
                  >
                    <FiCornerUpLeft size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveReactionMsgId((prev) => (prev === msg._id ? null : msg._id));
                      setActiveMenuMsgId(null);
                    }}
                    className="p-1 rounded-lg theme-text-muted hover:theme-accent-text transition cursor-pointer"
                    title="React"
                  >
                    <FiSmile size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuMsgId(msg._id);
                      setActiveReactionMsgId(null);
                    }}
                    className="p-1 rounded-lg theme-text-muted hover:theme-accent-text transition cursor-pointer"
                    title="More Options"
                  >
                    <FiMoreVertical size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 📊 POLL RESULTS / VOTERS DETAILS MODAL */}
      {pollModalMsg && (
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setPollModalMsg(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-4 bg-slate-900 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FiBarChart2 className="text-sky-400" /> Poll Results
              </h4>
              <button
                type="button"
                onClick={() => setPollModalMsg(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="font-semibold text-xs text-slate-200">
              {pollModalMsg.pollData?.question}
            </div>

            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
              {pollModalMsg.pollData?.options?.map((opt, idx) => {
                const totalVotes = pollModalMsg.pollData.options.reduce(
                  (acc, o) => acc + (o.votes?.length || 0),
                  0
                );
                const votesCount = opt.votes?.length || 0;
                const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;

                return (
                  <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{opt.text}</span>
                      <span className="text-sky-400 font-mono">{votesCount} votes ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-slate-400 text-center font-mono">
              Total Votes: {pollModalMsg.pollData.options.reduce((acc, o) => acc + (o.votes?.length || 0), 0)}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 MESSAGE OPTIONS MENU */}
      {activeMenuMessage && (
        <div
          className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveMenuMsgId(null)}
        >
          <div
            className="w-64 theme-panel-bg border theme-border rounded-3xl p-3 shadow-2xl z-[1000000] flex flex-col gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 border-b theme-border flex items-center justify-between">
              <span className="text-[11px] font-bold theme-text-muted">Message Options</span>
              <button
                type="button"
                onClick={() => setActiveMenuMsgId(null)}
                className="theme-text-muted hover:theme-text p-0.5 rounded-full cursor-pointer"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* 🌟 REACTIONS AT THE VERY TOP */}
            <div className="flex items-center justify-around p-2 theme-soft-bg rounded-2xl border theme-border shadow-inner">
              {DEFAULT_REACTIONS.slice(0, 5).map((emoji) => {
                const existingMyReaction = activeMenuMessage.reactions?.find(
                  (r) => (r.user?._id || r.user)?.toString() === currentUserId && r.emoji === emoji
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReactionClick(activeMenuMessage, emoji)}
                    className={`hover:scale-125 transition-transform text-lg cursor-pointer p-1 rounded-full ${
                      existingMyReaction ? "bg-amber-500/20 ring-1 ring-amber-400" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  const targetMsgId = activeMenuMessage._id;
                  setActiveMenuMsgId(null);
                  setShowFullEmojiPickerMsgId(targetMsgId);
                }}
                className="w-7 h-7 rounded-full theme-panel-bg border theme-border text-xs flex items-center justify-center theme-text cursor-pointer hover:theme-accent-tint shadow-sm"
                title="More emojis"
              >
                <FiPlus size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setReplyingMessage(activeMenuMessage);
                setActiveMenuMsgId(null);
              }}
              className="w-full px-3 py-2 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2.5 transition cursor-pointer"
            >
              <FiCornerUpLeft size={14} className="theme-accent-text" /> Reply
            </button>

            {isMenuMessageMe && activeMenuMessage.text && (
              <button
                type="button"
                onClick={() => {
                  setEditModalMsg(activeMenuMessage);
                  setEditText(activeMenuMessage.text);
                  setActiveMenuMsgId(null);
                }}
                className="w-full px-3 py-2 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2.5 transition text-sky-400 cursor-pointer"
              >
                <FiEdit2 size={14} /> Edit Message
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (togglePinMessage) togglePinMessage(activeMenuMessage._id);
                toast.success(activeMenuMessage.isPinned ? "Message unpinned" : "Message pinned 📌");
                setActiveMenuMsgId(null);
              }}
              className="w-full px-3 py-2 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2.5 transition cursor-pointer"
            >
              <FiStar size={14} className="text-amber-500" />
              {activeMenuMessage.isPinned ? "Unpin Message" : "Pin Message"}
            </button>

            {isMenuMessageMe && (
              <button
                type="button"
                onClick={() => {
                  setInfoModalMsg(activeMenuMessage);
                  setActiveMenuMsgId(null);
                }}
                className="w-full px-3 py-2 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2.5 transition cursor-pointer"
              >
                <FiInfo size={14} className="text-sky-400" /> Message Info
              </button>
            )}

            {activeMenuMessage.text && (
              <button
                type="button"
                onClick={() => {
                  handleCopy(activeMenuMessage.text);
                }}
                className="w-full px-3 py-2 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2.5 transition cursor-pointer"
              >
                <FiCopy size={14} /> Copy Text
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setDeleteModalMsg(activeMenuMessage);
                setActiveMenuMsgId(null);
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-red-500/10 text-left text-xs font-medium text-red-500 flex items-center gap-2.5 transition border-t theme-border mt-1 pt-2 cursor-pointer"
            >
              <FiTrash2 size={14} /> Delete Message
            </button>
          </div>
        </div>
      )}

      {/* 🌟 FULL EMOJI PICKER MODAL */}
      {showFullEmojiPickerMsgId && (
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowFullEmojiPickerMsgId(null)}
        >
          <div
            className="shadow-2xl rounded-3xl overflow-hidden border theme-border bg-black relative z-[10000000]"
            onClick={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              theme={Theme.AUTO}
              onEmojiClick={(emojiData) => {
                handleReactionClick(messages.find(m => m._id === showFullEmojiPickerMsgId), emojiData.emoji);
                setShowFullEmojiPickerMsgId(null);
              }}
              searchPlaceHolder="Search reaction emoji..."
              width={320}
              height={380}
            />
          </div>
        </div>
      )}

      {typingUsers && typingUsers.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs theme-accent-text font-medium animate-pulse ml-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full theme-accent-bg" />
          <span>{typingUsers.join(", ")} is typing...</span>
        </div>
      )}

      {/* WHATSAPP STYLE MESSAGE INFO MODAL */}
{infoModalMsg && (
  <div
    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
    onClick={() => setInfoModalMsg(null)}
  >
    <div
      className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 border-b theme-border">
        <h4 className="text-sm font-bold theme-text flex items-center gap-2">
          <FiInfo className="text-sky-400" /> Message Info
        </h4>
        <button
          type="button"
          onClick={() => setInfoModalMsg(null)}
          className="theme-text-muted hover:theme-text cursor-pointer"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="p-3 rounded-2xl theme-soft-bg border theme-border text-xs theme-text break-all">
        {infoModalMsg.text}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-sky-400 font-semibold">
            <FiCheck className="stroke-[2.8]" size={15} /> Read / Seen By
          </span>
          <span className="theme-text-muted font-mono">
            {(() => {
              const readList = infoModalMsg.readBy || [];
              // Find the entry for the other participant
              const otherReadEntry = readList.find(
                (r) => (r?.user?._id || r?.user)?.toString() !== currentUserId
              );
              
              const exactReadTime = otherReadEntry?.readAt;

              if (exactReadTime) {
                return new Date(exactReadTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              return readList.length > (isSelfChat ? 0 : 1) ? "Seen" : "Not seen yet";
            })()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-slate-300 font-semibold">
            <FiCheck className="stroke-[2.2]" size={15} /> Delivered To
          </span>
          <span className="theme-text-muted font-mono">
            {new Date(infoModalMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  </div>
)}

      {/* EDIT MESSAGE MODAL */}
      {editModalMsg && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setEditModalMsg(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-4 shadow-2xl flex flex-col gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b theme-border">
              <h4 className="text-sm font-bold theme-text flex items-center gap-1.5">
                <FiEdit2 className="text-sky-400" /> Edit message
              </h4>
              <button
                type="button"
                onClick={() => setEditModalMsg(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <FiX size={15} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-2.5 mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-xs rounded-xl theme-soft-bg border theme-border theme-text outline-none theme-accent-focus resize-none"
                placeholder="Edit your message..."
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalMsg(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold theme-soft-bg theme-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold theme-accent-bg shadow cursor-pointer"
                >
                  Save Edit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalMsg && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setDeleteModalMsg(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-4 shadow-2xl flex flex-col gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold theme-text flex items-center gap-1.5">
              <FiTrash2 className="text-red-500" /> Delete message?
            </h4>
            <p className="text-xs theme-text-muted leading-relaxed">
              Choose an option to remove this message.
            </p>

            <div className="flex flex-col gap-1.5 mt-1">
              {(deleteModalMsg.sender?._id || deleteModalMsg.sender)?.toString() === currentUserId &&
                !isSelfChat &&
                !isSavedCloud &&
                !deleteModalMsg.deletedForEveryone && (
                  <button
                    type="button"
                    onClick={() => handleDeleteConfirm(true)}
                    className="w-full py-2 rounded-xl bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition cursor-pointer"
                  >
                    Delete for Everyone
                  </button>
                )}

              <button
                type="button"
                onClick={() => handleDeleteConfirm(false)}
                className="w-full py-2 rounded-xl theme-soft-bg text-xs font-semibold theme-text hover:bg-red-500/15 hover:text-red-500 transition cursor-pointer"
              >
                Delete for Me
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalMsg(null)}
                className="w-full py-1.5 rounded-xl text-xs font-medium theme-text-muted hover:theme-text transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;