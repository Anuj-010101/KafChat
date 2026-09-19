import { useState, useRef, useEffect } from "react";
import {
  FiCheck,
  FiMoreVertical,
  FiCornerUpLeft,
  FiTrash2,
  FiCopy,
  FiStar,
  FiDownload,
  FiFileText,
  FiMusic,
  FiCloud,
  FiSmile,
  FiCheckCircle,
  FiBookmark,
  FiShare2,
  FiAtSign,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import { formatTime } from "../../utils/formatTime";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import api from "../../services/api";
import toast from "react-hot-toast";

const DEFAULT_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "🙏"];

const formatLongText = (text) => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => {
      if (word.length > 25 && !word.startsWith("http")) {
        return word.match(/.{1,20}/g).join("\u200B");
      }
      return word;
    })
    .join(" ");
};

const MessageBubble = ({ message }) => {
  const { user } = useAuth();
  const {
    activeChat,
    setReplyingMessage,
    deleteMessage,
    reactToMessage,
    togglePinMessage,
    votePoll,
    onlineUserIds,
  } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Swipe & Long Press states
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef(null);

  const menuRef = useRef(null);

  const currentUserId = (user?._id || user?.id)?.toString();
  const messageSenderId = (message.sender?._id || message.sender)?.toString();
  const isSender = messageSenderId === currentUserId;

  const isSelfChat = Boolean(activeChat?.isSelfChat);
  const isSavedCloud = Boolean(activeChat?.isSavedCloud);
  const isGroup = Boolean(activeChat?.isGroupChat);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactionPicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Robust Touch handlers for Slide-to-Reply & Mobile Long Press
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);

    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
      if (navigator.vibrate) navigator.vibrate(60);
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // If scrolling vertically, cancel long press & swipe
    if (Math.abs(diffY) > 15 || Math.abs(diffY) > Math.abs(diffX)) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      setIsSwiping(false);
      return;
    }

    if (Math.abs(diffX) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Slide-to-Reply offset (right swipe)
    if (diffX > 0 && diffX < 130) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsSwiping(false);

    if (swipeOffset > 55) {
      setReplyingMessage(message);
    }
    setSwipeOffset(0);
  };

  const renderReadReceiptTicks = () => {
    if (!isSender) return null;

    if (isSelfChat || isSavedCloud) {
      return (
        <span className="flex items-center text-sky-400 font-bold ml-1 text-xs" title="Saved to Vault">
          <FiCheck className="-mr-1.5" size={13} />
          <FiCheck size={13} />
        </span>
      );
    }

    const readList = message.readBy || [];
    const isReadByOther = isGroup
      ? readList.length > 1
      : readList.some((id) => (id?._id || id)?.toString() !== currentUserId);

    if (isReadByOther) {
      return (
        <span className="flex items-center text-sky-400 font-bold ml-1 text-xs" title="Read">
          <FiCheck className="-mr-1.5" size={13} />
          <FiCheck size={13} />
        </span>
      );
    }

    const otherParticipant = activeChat?.participants?.find(
      (p) => (p?._id || p)?.toString() !== currentUserId
    );
    const otherUserId = (otherParticipant?._id || otherParticipant)?.toString();
    const isReceiverOnline = onlineUserIds && onlineUserIds.includes(otherUserId);

    if (isReceiverOnline || (message.deliveredTo && message.deliveredTo.length > 0)) {
      return (
        <span className="flex items-center text-gray-300 ml-1 text-xs" title="Delivered">
          <FiCheck className="-mr-1.5" size={13} />
          <FiCheck size={13} />
        </span>
      );
    }

    return (
      <span className="flex items-center text-gray-300 ml-1 text-xs" title="Sent">
        <FiCheck size={13} />
      </span>
    );
  };

  const handleCopyText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success("Text copied 📋");
    }
    setShowMenu(false);
  };

  const handleSaveToStreakVault = async () => {
    try {
      const otherParticipant = activeChat?.participants?.find(
        (p) => (p?._id || p)?.toString() !== currentUserId
      );
      const otherUserId = (otherParticipant?._id || otherParticipant)?.toString();
      if (!otherUserId) return;

      const { data: streakRes } = await api.get(`/streaks/${otherUserId}`);
      const streakId = streakRes.streak?._id;
      if (!streakId) {
        toast.error("No active streak found with this contact");
        return;
      }

      await api.post(`/streaks/${streakId}/save-snap`, {
        snapId: message._id,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
      });
      toast.success("Snap saved to Dedicated Streak Vault! 📌");
      setShowMenu(false);
    } catch {
      toast.error("Failed to save snap to vault");
    }
  };

  const handleDeleteExecute = async (forEveryone) => {
    try {
      if (deleteMessage) {
        await deleteMessage(message._id, forEveryone);
        toast.success(forEveryone ? "Deleted for everyone" : "Deleted for you");
      }
      setShowDeleteModal(false);
      setShowMenu(false);
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const isStoryMentionMessage =
    message.mediaType === "story_mention" ||
    Boolean(message.storyMentionContext) ||
    Boolean(message.storyContext?.isMention);

  const mentionContext = message.storyMentionContext || message.storyContext;

  const handleOpenStudioFromMention = (e) => {
    e.stopPropagation();
    if (!mentionContext) return;

    const payload = {
      statusId: mentionContext.statusId || mentionContext._id,
      authorId: mentionContext.authorId || message.sender?._id || message.sender,
      authorName: mentionContext.authorName || message.sender?.fullName || "User",
      authorUsername: mentionContext.authorUsername || message.sender?.username || "user",
      authorAvatar: mentionContext.authorAvatar || message.sender?.avatar || "",
      mediaType: mentionContext.mediaType || "text",
      mediaUrl: mentionContext.mediaUrl || null,
      text: mentionContext.text || "",
      backgroundColor: mentionContext.backgroundColor || "#0284C7",
      textColor: mentionContext.textColor || "#ffffff",
      fontFamily: mentionContext.fontFamily || "sans-serif",
    };

    window.dispatchEvent(
      new CustomEvent("reshare_story_to_modal", {
        detail: { storyContext: payload },
      })
    );
  };

  if (message.deletedForEveryone) {
    return (
      <div className={`flex w-full my-1 ${isSender ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%] px-3.5 py-2 rounded-2xl bg-gray-500/10 border border-gray-500/20 text-xs italic text-gray-400 flex items-center gap-2">
          <FiTrash2 size={13} />
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  if (isStoryMentionMessage && mentionContext) {
    return (
      <div className={`flex w-full my-1 ${isSender ? "justify-end" : "justify-start"}`}>
        <div className="w-[170px] rounded-xl overflow-hidden border border-white/10 bg-slate-900/90 shadow-md flex flex-col select-none">
          <div className="px-2 py-1 bg-white/5 flex items-center justify-between border-b border-white/5">
            <span className="text-[9px] font-bold text-pink-400 flex items-center gap-1">
              <FiAtSign size={9} /> Mention
            </span>
            <span className="text-[8px] text-white/40 font-mono">
              @{mentionContext.authorUsername || message.sender?.username || "user"}
            </span>
          </div>

          <div
            className="w-full h-[68px] flex items-center justify-center p-1.5 relative overflow-hidden"
            style={{
              backgroundColor:
                mentionContext.mediaType === "text"
                  ? mentionContext.backgroundColor || "#0284C7"
                  : "#000000",
            }}
          >
            {mentionContext.mediaType === "text" ? (
              <p
                className="text-[9px] font-bold line-clamp-2 text-center leading-snug px-1"
                style={{ color: mentionContext.textColor || "#ffffff", wordBreak: "break-all" }}
              >
                "{mentionContext.text}"
              </p>
            ) : (
              <img
                src={mentionContext.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover rounded"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenStudioFromMention}
            className="w-full py-1 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-black font-extrabold text-[9px] flex items-center justify-center gap-1 transition"
          >
            <FiShare2 size={9} />
            <span>Add to your story</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: "pan-y",
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? "transform 0.2s ease" : "none",
      }}
      className={`group relative flex w-full my-1.5 items-end gap-2 ${
        isSender ? "justify-end" : "justify-start"
      }`}
    >
      {!isSender && isGroup && (
        <Avatar
          src={message.sender?.avatar}
          alt={message.sender?.fullName}
          size="xs"
          className="mb-1 shrink-0"
        />
      )}

      {/* Message Box */}
      <div
        style={{ wordBreak: "break-all", overflowWrap: "anywhere", maxWidth: "85%" }}
        className={`relative rounded-2xl px-3.5 py-2.5 shadow-md flex flex-col gap-1 transition-all ${
          isSender
            ? "theme-accent-bg text-white rounded-br-xs"
            : "theme-panel-bg theme-text border theme-border rounded-bl-xs"
        }`}
      >
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 mb-0.5">
            <FiStar size={11} />
            <span>Pinned Message</span>
          </div>
        )}

        {/* Story Reply / React Context Box */}
        {message.mediaType === "story_reply" && message.storyContext && (
          <div className="p-2 rounded-xl bg-black/25 border border-white/20 mb-1 flex items-center gap-2.5 min-w-0">
            {message.storyContext.mediaUrl ? (
              <img
                src={message.storyContext.mediaUrl}
                alt="Story Context"
                className="w-10 h-14 rounded-lg object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-10 h-14 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                Story
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
                Story Reply
              </span>
              <span className="text-xs truncate font-medium">
                {message.text}
              </span>
            </div>
          </div>
        )}

        {/* Quoted Standard Reply */}
        {message.replyTo && message.mediaType !== "story_reply" && (
          <div
            className={`p-2 rounded-xl text-xs mb-1 border-l-4 flex flex-col min-w-0 ${
              isSender
                ? "bg-black/20 border-white/80 text-white/90"
                : "theme-soft-bg border-sky-500 theme-text-muted"
            }`}
          >
            <span className="font-bold text-[11px] truncate">
              {message.replyTo.sender?.fullName || "User"}
            </span>
            <span className="truncate text-[11px]">
              {message.replyTo.text ||
                (message.replyTo.mediaType === "poll"
                  ? "📊 Poll"
                  : `📎 ${message.replyTo.mediaType || "Media"}`)}
            </span>
          </div>
        )}

        {!isSender && isGroup && (
          <span className="text-[11px] font-bold text-sky-500 truncate">
            {message.sender?.fullName || message.sender?.username}
          </span>
        )}

        {/* Media: Image */}
        {message.mediaUrl && message.mediaType === "image" && (
          <div className="rounded-xl overflow-hidden my-1 max-h-80 bg-black/10">
            <img
              src={message.mediaUrl}
              alt="Photo"
              className="w-full h-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
              onClick={() => window.open(message.mediaUrl, "_blank")}
            />
          </div>
        )}

        {/* Media: Video */}
        {message.mediaUrl && message.mediaType === "video" && (
          <div className="rounded-xl overflow-hidden my-1 max-h-80 bg-black">
            <video
              src={message.mediaUrl}
              controls
              className="w-full max-h-72 rounded-xl object-contain"
            />
          </div>
        )}

        {/* Media: Audio */}
        {message.mediaUrl && message.mediaType === "audio" && (
          <div className="flex items-center gap-2.5 p-1 my-0.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <FiMusic size={14} />
            </div>
            <audio src={message.mediaUrl} controls className="w-48 sm:w-56 h-8" />
          </div>
        )}

        {/* Media: Document / Vault File */}
        {message.mediaUrl && message.mediaType === "document" && (
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 my-1 min-w-0 ${
              isSender ? "bg-black/20 border-white/20" : "theme-soft-bg theme-border"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                {message.isVaultFile ? <FiCloud size={18} /> : <FiFileText size={18} />}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold truncate">
                  {message.fileName || "Document.pdf"}
                </span>
                <span className="text-[10px] opacity-75 font-mono">
                  {message.fileSizeFormatted || "File"}
                </span>
              </div>
            </div>
            <a
              href={message.mediaUrl}
              download={message.fileName || "download"}
              target="_blank"
              rel="noreferrer"
              className={`p-2 rounded-lg transition shrink-0 ${
                isSender
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "theme-soft-bg hover:theme-accent-text theme-text"
              }`}
              title="Download"
            >
              <FiDownload size={15} />
            </a>
          </div>
        )}

        {/* Poll Component */}
        {message.pollData && message.pollData.options && (
          <div className="p-3 rounded-2xl bg-black/10 border border-white/10 my-1 flex flex-col gap-2.5 min-w-0">
            <span
              style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
              className="text-xs font-bold leading-tight"
            >
              {formatLongText(message.pollData.question)}
            </span>
            <div className="flex flex-col gap-2">
              {message.pollData.options.map((opt, optIdx) => {
                const totalVotes = message.pollData.options.reduce(
                  (acc, o) => acc + (o.votes?.length || 0),
                  0
                );
                const votesCount = opt.votes?.length || 0;
                const percentage =
                  totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                const hasVoted = opt.votes?.some(
                  (id) => (id?._id || id)?.toString() === currentUserId
                );

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => votePoll && votePoll(message._id, optIdx)}
                    className={`relative p-2.5 rounded-xl border text-xs text-left overflow-hidden transition ${
                      hasVoted
                        ? "border-sky-400 bg-sky-500/20 font-semibold"
                        : "border-white/20 bg-black/15 hover:bg-black/25"
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-sky-500/30 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between z-10 gap-2">
                      <span
                        style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                        className="flex items-center gap-1.5"
                      >
                        {hasVoted && <FiCheckCircle className="text-sky-400 shrink-0" size={13} />}
                        {formatLongText(opt.text)}
                      </span>
                      <span className="text-[10px] opacity-80 font-mono shrink-0">
                        {votesCount} ({percentage}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Plain Text Content */}
        {message.text && message.mediaType !== "story_reply" && (
          <p
            style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
            className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed"
          >
            {formatLongText(message.text)}
          </p>
        )}

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((r, rIdx) => (
              <span
                key={rIdx}
                className="px-1.5 py-0.5 rounded-full bg-black/30 text-[11px] flex items-center gap-1 border border-white/10"
              >
                <span>{r.emoji}</span>
              </span>
            ))}
          </div>
        )}

        {/* Bubble Footer */}
        <div
          className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${
            isSender ? "text-white/80" : "theme-text-muted"
          }`}
        >
          {message.isEdited && <span className="italic text-[9px]">Edited</span>}
          <span>{formatTime(message.createdAt)}</span>
          {renderReadReceiptTicks()}
        </div>

        {/* Context Action Menu Trigger */}
        <div
          ref={menuRef}
          className={`absolute top-1.5 ${
            isSender ? "-left-16" : "-right-16"
          } ${showMenu ? "opacity-100 flex" : "opacity-0 group-hover:opacity-100"} transition-opacity flex items-center gap-1 z-30`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionPicker((prev) => !prev);
            }}
            className="p-1.5 rounded-full theme-soft-bg theme-text-muted hover:theme-text border theme-border shadow-sm transition"
            title="React"
          >
            <FiSmile size={13} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            className="p-1.5 rounded-full theme-soft-bg theme-text-muted hover:theme-text border theme-border shadow-sm transition"
            title="Options"
          >
            <FiMoreVertical size={13} />
          </button>

          {/* Emoji Picker Popup */}
          {showReactionPicker && (
            <div
              className={`absolute -top-10 ${
                isSender ? "right-0" : "left-0"
              } p-1.5 rounded-full theme-panel-bg border theme-border shadow-2xl flex items-center gap-1.5 z-50 animate-bubbleIn`}
            >
              {DEFAULT_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    if (reactToMessage) reactToMessage(message._id, emoji);
                    setShowReactionPicker(false);
                    setShowMenu(false);
                  }}
                  className="text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Context Menu Dropdown */}
          {showMenu && (
            <div
              className={`absolute top-8 ${
                isSender ? "right-0" : "left-0"
              } w-48 theme-panel-bg border theme-border rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 animate-bubbleIn`}
            >
              <button
                type="button"
                onClick={() => {
                  setReplyingMessage(message);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2 transition"
              >
                <FiCornerUpLeft size={13} className="theme-accent-text" /> Reply
              </button>

              {message.mediaUrl && (
                <button
                  type="button"
                  onClick={handleSaveToStreakVault}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium text-amber-400 flex items-center gap-2 transition"
                >
                  <FiBookmark size={13} /> Save to Streak Vault
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (togglePinMessage) togglePinMessage(message._id);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2 transition"
              >
                <FiStar size={13} className="text-amber-500" />{" "}
                {message.isPinned ? "Unpin Message" : "Pin Message"}
              </button>

              {message.text && (
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="w-full px-2.5 py-1.5 rounded-xl hover:theme-soft-bg text-left text-xs font-medium theme-text flex items-center gap-2 transition"
                >
                  <FiCopy size={13} /> Copy Text
                </button>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 text-left text-xs font-medium text-red-500 flex items-center gap-2 transition border-t theme-border mt-0.5 pt-1.5"
              >
                <FiTrash2 size={13} /> Delete Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl animate-bubbleIn flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold theme-text flex items-center gap-2">
              <FiTrash2 className="text-red-500" /> Delete message?
            </h4>
            <p className="text-xs theme-text-muted leading-relaxed">
              Choose how you want to delete this message.
            </p>

            <div className="flex flex-col gap-2 mt-2">
              {isSender && !isSelfChat && !isSavedCloud && (
                <button
                  type="button"
                  onClick={() => handleDeleteExecute(true)}
                  className="w-full py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition"
                >
                  Delete for Everyone
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteExecute(false)}
                className="w-full py-2.5 rounded-xl theme-soft-bg text-xs font-semibold theme-text hover:bg-red-500/15 hover:text-red-500 transition"
              >
                Delete for Me
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2 rounded-xl text-xs font-medium theme-text-muted hover:theme-text transition"
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

export default MessageBubble;