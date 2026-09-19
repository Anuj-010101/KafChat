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
} from "react-icons/fi";
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
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [editModalMsg, setEditModalMsg] = useState(null);
  const [editText, setEditText] = useState("");

  // Swipe & Long Press states for mobile gesture support
  const [swipeOffsets, setSwipeOffsets] = useState({});
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef(null);

  const menuContainerRef = useRef(null);
  const currentUserId = (user?._id || user?.id)?.toString();
  const isSelfChat = Boolean(activeChat?.isSelfChat);
  const isSavedCloud = Boolean(activeChat?.isSavedCloud);
  const isGroup = Boolean(activeChat?.isGroupChat);
  const currentUserIsVIP = Boolean(user?.isVIP || isVip);

  // Close context menu on outside click
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

  // 📸 PRO/VIP SNAPCHAT SCREENSHOT & RECORDING LISTENER
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

    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.shiftKey && e.key === "S")) {
        if (activeChat?._id) {
          activeSocket.emit("screenshot_taken", {
            chatId: activeChat._id,
            username: user?.username,
            captureType: "screenshot",
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      activeSocket.off("screenshot_alert", handleScreenshotAlert);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeChat?._id, user?.username, currentUserIsVIP, socket]);

  // Touch handlers for mobile Slide-to-Reply and Long-press
  const handleTouchStart = (msgId, e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;

    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      setActiveMenuMsgId(msgId);
      setActiveReactionMsgId(null);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (msgId, e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    if (Math.abs(diffY) > 15 || Math.abs(diffY) > Math.abs(diffX)) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      return;
    }

    if (Math.abs(diffX) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (diffX > 0 && diffX < 120) {
      setSwipeOffsets((prev) => ({ ...prev, [msgId]: diffX }));
    }
  };

  const handleTouchEnd = (msg, e) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    const offset = swipeOffsets[msg._id] || 0;

    if (offset > 55) {
      setReplyingMessage(msg);
    }
    setSwipeOffsets((prev) => ({ ...prev, [msg._id]: 0 }));
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
        <span
          className="flex items-center text-[#53bdeb] drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] font-bold ml-1 text-xs"
          title="Saved & Synced (Cloud)"
        >
          <FiCheck className="-mr-1.5 stroke-[2.5]" size={13} />
          <FiCheck className="stroke-[2.5]" size={13} />
        </span>
      );
    }

    const readList = msg.readBy || [];
    const isReadByOther = isGroup
      ? readList.length > 1
      : readList.some((id) => (id?._id || id)?.toString() !== currentUserId);

    if (isReadByOther) {
      return (
        <span
          className="flex items-center text-[#53bdeb] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-extrabold ml-1 text-xs"
          title="Read (Seen)"
        >
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

    if (isReceiverOnline || (msg.deliveredTo && msg.deliveredTo.length > 0)) {
      return (
        <span
          className="flex items-center text-slate-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] opacity-95 ml-1 text-xs font-semibold"
          title="Delivered (Net ON)"
        >
          <FiCheck className="-mr-1.5 stroke-[2.2]" size={13} />
          <FiCheck className="stroke-[2.2]" size={13} />
        </span>
      );
    }

    return (
      <span
        className="flex items-center text-slate-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] opacity-90 ml-1 text-xs font-semibold"
        title="Sent (Net OFF)"
      >
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
        <p className="text-xs theme-text-muted mt-0.5">
          No one outside of this chat, not even KafChat, can read or listen to them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 relative" ref={menuContainerRef}>
      {/* Encryption Banner Top */}
      <div className="flex justify-center my-1">
        <span className="px-3 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-400 flex items-center gap-1.5 shadow-sm">
          <FiLock size={10} className="text-amber-400" /> End-to-End Encrypted
        </span>
      </div>

      {messages.map((msg) => {
        const isMe = (msg.sender?._id || msg.sender)?.toString() === currentUserId;
        const isHovered = hoveredMsgId === msg._id;
        const isMenuOpen = activeMenuMsgId === msg._id;
        const isReactionOpen = activeReactionMsgId === msg._id;
        const currentSwipeOffset = swipeOffsets[msg._id] || 0;

        // System Notification
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

        // Anti-Delete Handling for Pro / VIP Users vs Normal Users
        if (msg.deletedForEveryone) {
          if (currentUserIsVIP || msg.isAntiDeleteRecovered) {
            return (
              <div
                key={msg._id}
                onMouseEnter={() => setHoveredMsgId(msg._id)}
                onMouseLeave={() => setHoveredMsgId(null)}
                className={`flex flex-col my-1 relative group ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="max-w-[75%] px-3 py-2 rounded-2xl bg-gradient-to-r from-red-500/10 via-pink-500/10 to-amber-500/10 border border-pink-500/30 text-xs text-white flex flex-col gap-1 shadow-md relative">
                  <span className="text-[9px] font-bold text-pink-400 flex items-center gap-1">
                    <FiTrash2 size={10} /> 👑 VIP Recovered (Deleted by @{msg.sender?.username || "user"}):
                  </span>
                  <p className="line-through text-slate-300 opacity-90">{msg.text || "Original message content"}</p>
                </div>

                {isHovered && (
                  <div className={`absolute top-1 ${isMe ? "-left-10" : "-right-10"} flex items-center z-20`}>
                    <button
                      type="button"
                      onClick={() => setDeleteModalMsg(msg)}
                      className="p-1.5 rounded-full theme-soft-bg text-red-400 hover:bg-red-500/20 border theme-border shadow transition"
                      title="Delete options"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={msg._id}
              onMouseEnter={() => setHoveredMsgId(msg._id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              className={`flex flex-col my-1 relative group ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="max-w-[75%] px-3 py-1.5 rounded-xl bg-gray-500/10 border border-gray-500/20 text-xs italic text-gray-400 flex items-center gap-1.5">
                <FiTrash2 size={12} />
                <span>This message was deleted</span>
              </div>

              {isHovered && (
                <div className={`absolute top-1 ${isMe ? "-left-10" : "-right-10"} flex items-center z-20`}>
                  <button
                    type="button"
                    onClick={() => setDeleteModalMsg(msg)}
                    className="p-1.5 rounded-full theme-soft-bg text-red-400 hover:bg-red-500/20 border theme-border shadow transition"
                    title="Delete for me"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={msg._id}
            onMouseEnter={() => setHoveredMsgId(msg._id)}
            onMouseLeave={() => setHoveredMsgId(null)}
            onTouchStart={(e) => handleTouchStart(msg._id, e)}
            onTouchMove={(e) => handleTouchMove(msg._id, e)}
            onTouchEnd={(e) => handleTouchEnd(msg, e)}
            style={{
              touchAction: "pan-y",
              transform: `translateX(${currentSwipeOffset}px)`,
              transition: currentSwipeOffset === 0 ? "transform 0.2s ease" : "none",
            }}
            className={`flex flex-col group relative ${isMe ? "items-end" : "items-start"}`}
          >
            {activeChat?.isGroupChat && !isMe && msg.sender?.fullName && (
              <span className="text-[10px] font-semibold theme-accent-text ml-10 mb-0.5">
                {msg.sender.fullName}
              </span>
            )}

            <div
              className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%] ${
                isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
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
                    <span>Pinned</span>
                  </div>
                )}

                {/* ULTRA-COMPACT INSTAGRAM MENTION CARD */}
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
                        className="w-full py-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 active:scale-95 text-white font-bold text-[9px] flex items-center justify-center gap-1 transition border-t border-white/10"
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
                  <div className="rounded-xl overflow-hidden my-1 max-h-60 bg-black/10">
                    <img
                      src={msg.mediaUrl}
                      alt="Shared Media"
                      className="rounded-xl w-full h-auto object-cover cursor-pointer hover:opacity-95 transition"
                      onClick={() => window.open(msg.mediaUrl, "_blank")}
                    />
                  </div>
                )}

                {msg.mediaUrl && msg.mediaType === "video" && !msg.storyContext && (
                  <div className="rounded-xl overflow-hidden my-1 max-h-60 bg-black">
                    <video src={msg.mediaUrl} controls className="w-full max-h-56 rounded-xl object-contain" />
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

                {msg.mediaType === "poll" && msg.pollData && (
                  <div className="flex flex-col gap-1.5 min-w-[200px] p-2 rounded-xl bg-black/10 border border-white/10 my-1">
                    <span className="font-bold text-xs tracking-wide block">
                      {msg.pollData.question}
                    </span>
                    <div className="flex flex-col gap-1 mt-0.5">
                      {msg.pollData.options?.map((opt, idx) => {
                        const totalVotes = msg.pollData.options.reduce(
                          (acc, o) => acc + (o.votes?.length || 0),
                          0
                        );
                        const votesCount = opt.votes?.length || 0;
                        const percentage = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                        const hasVoted = opt.votes?.some((v) => (v?._id || v)?.toString() === currentUserId);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => votePoll && votePoll(msg._id, idx)}
                            className={`relative p-2 rounded-lg text-left text-xs font-medium flex items-center justify-between border transition overflow-hidden ${
                              hasVoted
                                ? "bg-sky-500/25 border-sky-400 font-semibold"
                                : "bg-black/15 border-white/15 hover:bg-black/25"
                            }`}
                          >
                            <div
                              className="absolute inset-y-0 left-0 bg-sky-500/30 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative flex items-center justify-between z-10 w-full">
                              <span className="flex items-center gap-1">
                                {hasVoted && <FiCheckCircle className="text-sky-400" size={12} />}
                                {opt.text}
                              </span>
                              <span className="text-[9px] font-bold opacity-85 font-mono ml-2">
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

                <div
                  className={`flex items-center justify-end gap-1 mt-0.5 text-[9px] ${
                    isMe ? "text-white/90" : "theme-text-muted"
                  }`}
                >
                  {msg.isEdited && <span className="italic text-[8px] opacity-80">(edited)</span>}
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && renderReadReceiptTicks(msg)}
                </div>

                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="absolute -bottom-2.5 right-2 px-1.5 py-0.5 rounded-full theme-panel-bg border theme-border shadow-sm flex items-center gap-0.5 text-[9px]">
                    {msg.reactions.map((r, i) => (
                      <span key={i}>{r.emoji}</span>
                    ))}
                  </div>
                )}
              </div>

              {(isHovered || isMenuOpen || isReactionOpen) && (
                <div className="flex items-center gap-0.5 theme-panel-bg border theme-border rounded-xl p-0.5 shadow-md animate-fadeIn z-25">
                  <button
                    type="button"
                    onClick={() => setReplyingMessage(msg)}
                    className="p-1 rounded-lg theme-text-muted hover:theme-accent-text hover:theme-soft-bg transition"
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
                    className="p-1 rounded-lg theme-text-muted hover:theme-accent-text hover:theme-soft-bg transition"
                    title="React"
                  >
                    <FiSmile size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuMsgId((prev) => (prev === msg._id ? null : msg._id));
                      setActiveReactionMsgId(null);
                    }}
                    className="p-1 rounded-lg theme-text-muted hover:theme-accent-text hover:theme-soft-bg transition"
                    title="More Options"
                  >
                    <FiMoreVertical size={12} />
                  </button>

                  {isReactionOpen && (
                    <div className="absolute -top-9 left-0 flex items-center gap-1 p-1 rounded-full theme-panel-bg border theme-border shadow-2xl animate-bubbleIn z-30">
                      {DEFAULT_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            reactToMessage(msg._id, emoji);
                            setActiveReactionMsgId(null);
                          }}
                          className="hover:scale-125 transition-transform text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {isMenuOpen && (
                    <div
                      className={`absolute top-7 ${
                        isMe ? "right-0" : "left-0"
                      } w-40 theme-panel-bg border theme-border rounded-2xl p-1 shadow-2xl z-30 flex flex-col gap-0.5 animate-bubbleIn`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingMessage(msg);
                          setActiveMenuMsgId(null);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-1.5 transition"
                      >
                        <FiCornerUpLeft size={12} className="theme-accent-text" /> Reply
                      </button>

                      {isMe && msg.text && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditModalMsg(msg);
                            setEditText(msg.text);
                            setActiveMenuMsgId(null);
                          }}
                          className="w-full px-2 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-1.5 transition text-sky-400"
                        >
                          <FiEdit2 size={12} /> Edit Message
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (togglePinMessage) togglePinMessage(msg._id);
                          setActiveMenuMsgId(null);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-1.5 transition"
                      >
                        <FiStar size={12} className="text-amber-500" />{" "}
                        {msg.isPinned ? "Unpin Message" : "Pin Message"}
                      </button>

                      {msg.text && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text)}
                          className="w-full px-2 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-1.5 transition"
                        >
                          <FiCopy size={12} /> Copy Text
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalMsg(msg);
                          setActiveMenuMsgId(null);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl hover:bg-red-500/10 text-left text-xs font-medium text-red-500 flex items-center gap-1.5 transition border-t theme-border mt-0.5 pt-1"
                      >
                        <FiTrash2 size={12} /> Delete Message
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {typingUsers && typingUsers.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs theme-accent-text font-medium animate-pulse ml-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full theme-accent-bg" />
          <span>{typingUsers.join(", ")} is typing...</span>
        </div>
      )}

      {/* EDIT MESSAGE MODAL */}
      {editModalMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setEditModalMsg(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-4 shadow-2xl animate-bubbleIn flex flex-col gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b theme-border">
              <h4 className="text-sm font-bold theme-text flex items-center gap-1.5">
                <FiEdit2 className="text-sky-400" /> Edit message
              </h4>
              <button
                type="button"
                onClick={() => setEditModalMsg(null)}
                className="text-gray-400 hover:text-white"
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
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold theme-soft-bg theme-text hover:opacity-90 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold theme-accent-bg shadow transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setDeleteModalMsg(null)}
        >
          <div
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-4 shadow-2xl animate-bubbleIn flex flex-col gap-2.5"
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
                    className="w-full py-2 rounded-xl bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition"
                  >
                    Delete for Everyone
                  </button>
                )}

              <button
                type="button"
                onClick={() => handleDeleteConfirm(false)}
                className="w-full py-2 rounded-xl theme-soft-bg text-xs font-semibold theme-text hover:bg-red-500/15 hover:text-red-500 transition"
              >
                Delete for Me
              </button>

              <button
                type="button"
                onClick={() => setDeleteModalMsg(null)}
                className="w-full py-1.5 rounded-xl text-xs font-medium theme-text-muted hover:theme-text transition"
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