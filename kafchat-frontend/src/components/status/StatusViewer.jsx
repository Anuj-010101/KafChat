import { useEffect, useRef, useState, useMemo } from "react";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiEye,
  FiSend,
  FiStar,
  FiMusic,
  FiChevronUp,
  FiShare2,
  FiUser,
  FiAtSign,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import InteractiveSticker from "./InteractiveSticker";
import UserProfileModal from "../common/UserProfileModal";
import { useStatus } from "../../hooks/useStatus";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { formatLastSeen } from "../../utils/formatTime";
import api from "../../services/api";
import toast from "react-hot-toast";

const STORY_DURATION_MS = 10000;
const STATUS_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "🔥", "👏", "💯"];

const StatusViewer = ({ group, onClose, onReshareStory }) => {
  const { markViewed, removeStatus } = useStatus() || {};
  const { user } = useAuth();
  const { startChatWithUser } = useChat() || {};

  const currentUserId = (user?._id || user?.id)?.toString();
  const currentUsername = user?.username?.toLowerCase()?.trim();

  const statuses = group?.statuses || [];

  const initialUnseenIndex = useMemo(() => {
    if (!statuses || statuses.length === 0) return 0;
    const firstUnseen = statuses.findIndex(
      (s) =>
        !s.viewers?.some(
          (v) => (v?.user?._id || v?.user || v)?.toString() === currentUserId
        )
    );
    return firstUnseen !== -1 ? firstUnseen : 0;
  }, [statuses, currentUserId]);

  const [index, setIndex] = useState(initialUnseenIndex);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [showReactionSheet, setShowReactionSheet] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [showReshareAuthorBadge, setShowReshareAuthorBadge] = useState(false);

  const [selectedUsernameForProfile, setSelectedUsernameForProfile] = useState(null);

  const viewedStatusesRef = useRef(new Set());
  const touchStartYRef = useRef(null);

  const current = statuses[index];
  const isOwn = (current?.user?._id || current?.user)?.toString() === currentUserId;
  const activeDurationMs = current?.duration ? current.duration * 1000 : STORY_DURATION_MS;

  const authorUsername =
    current?.user?.username ||
    current?.user?.fullName?.toLowerCase()?.replace(/\s+/g, "");

  const isMentionedInCurrentStory = current?.stickers?.some((st) => {
    if (st.type !== "mention") return false;
    const cleanTag = st.value?.replace(/^@+/, "")?.toLowerCase()?.trim();
    return cleanTag && cleanTag === currentUsername;
  });

  const mentionedUsernames = (current?.stickers || [])
    .filter((s) => s.type === "mention")
    .map((s) => s.value?.replace(/^@+/, "")?.trim())
    .filter(Boolean);

  useEffect(() => {
    if (current && !isOwn && !viewedStatusesRef.current.has(current._id)) {
      viewedStatusesRef.current.add(current._id);
      if (markViewed) markViewed(current._id);
    }
    setProgress(0);
    setShowViewers(false);
    setShowReactionSheet(false);
    setShowReshareAuthorBadge(false);
    setSelectedUsernameForProfile(null);
  }, [index, current, isOwn, markViewed]);

  useEffect(() => {
    if (
      showViewers ||
      showReactionSheet ||
      selectedUsernameForProfile ||
      isPaused ||
      !current
    )
      return;

    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (index < statuses.length - 1) setIndex((i) => i + 1);
          else onClose();
          return 0;
        }
        return p + 100 / (activeDurationMs / 100);
      });
    }, 100);

    return () => clearInterval(tick);
  }, [
    index,
    statuses.length,
    showViewers,
    showReactionSheet,
    selectedUsernameForProfile,
    isPaused,
    current,
    activeDurationMs,
    onClose,
  ]);

  const goNext = () => {
    if (index < statuses.length - 1) setIndex((i) => i + 1);
    else onClose();
  };

  const goPrev = () => {
    if (index > 0) setIndex((i) => i - 1);
  };

  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    if (touchStartYRef.current !== null) {
      const deltaY = touchStartYRef.current - e.changedTouches[0].clientY;
      if (deltaY > 50 && !isOwn) {
        setShowReactionSheet(true);
      }
    }
    touchStartYRef.current = null;
    setIsPaused(false);
  };

  const handleSendReply = async (textToSend) => {
    const messageContent = textToSend || replyText;
    if (!messageContent.trim()) return;

    try {
      const statusId = current._id;
      const isEmojiReaction = STATUS_REACTIONS.includes(messageContent);

      await api.post(`/status/${statusId}/reply`, {
        text: isEmojiReaction ? "" : messageContent,
        emoji: isEmojiReaction ? messageContent : undefined,
      });

      toast.success(isEmojiReaction ? "Reaction sent!" : "Reply sent!");
      setReplyText("");
      setShowReactionSheet(false);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reply to story");
    }
  };

  const handleOpenStudioForReshare = (e) => {
    e.stopPropagation();
    const resharePayload = {
      statusId: current._id,
      authorId: current.user?._id || current.user,
      authorName: current.user?.fullName || "User",
      authorUsername: current.user?.username || authorUsername,
      authorAvatar: current.user?.avatar || "",
      mediaType: current.mediaType || "text",
      mediaUrl: current.mediaUrl || null,
      text: current.text || "",
      backgroundColor: current.backgroundColor || "#0284C7",
      textColor: current.textColor || "#ffffff",
      fontFamily: current.fontFamily || "sans-serif",
    };

    if (typeof onReshareStory === "function") {
      onReshareStory(resharePayload);
    } else {
      window.dispatchEvent(
        new CustomEvent("open_create_story_reshare", {
          detail: resharePayload,
        })
      );
    }
    onClose();
  };

  if (!current) return null;

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:")) return url;
    return `http://${window.location.hostname}:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      <div
        className="relative w-full max-w-sm h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
      >
        {/* Progress Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1">
          {statuses.map((s, i) => (
            <div
              key={s._id || i}
              className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
            >
              <div
                className="h-full bg-white transition-[width] duration-100 ease-linear"
                style={{
                  width: `${i < index ? 100 : i === index ? progress : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-6 inset-x-3 z-30 flex items-center justify-between p-2 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar src={current.user?.avatar} alt={authorUsername} size="sm" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs text-white font-extrabold truncate font-mono tracking-tight">
                  @{authorUsername}
                </p>

                {current.isReshare && current.reshareSnapshot && (
                  <span className="text-[11px] text-white/80 font-medium truncate flex items-center gap-0.5">
                    with{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUsernameForProfile(
                          current.reshareSnapshot.authorUsername ||
                            current.reshareSnapshot.authorName
                        );
                      }}
                      className="underline text-cyan-300 font-mono hover:text-white"
                    >
                      @
                      {current.reshareSnapshot.authorUsername ||
                        current.reshareSnapshot.authorName}
                    </button>
                  </span>
                )}

                {current.privacy === "close_friends" && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                    <FiStar size={8} className="fill-emerald-400" /> CF
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatLastSeen(current.createdAt)}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {isOwn && removeStatus && (
              <button
                type="button"
                onClick={() => {
                  removeStatus(current._id);
                  if (statuses.length <= 1) onClose();
                  else goNext();
                }}
                className="text-white/80 hover:text-red-400 p-1.5 rounded-full bg-black/40 backdrop-blur-md"
              >
                <FiTrash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-full bg-black/40 backdrop-blur-md"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Music Indicator */}
        {current.attachedSong?.title && (
          <div className="absolute top-20 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <FiMusic className="text-pink-400 animate-pulse" size={12} />
            <span className="truncate max-w-[200px]">
              {current.attachedSong.title}
            </span>
            {current.attachedSong.audioUrl && (
              <audio src={current.attachedSong.audioUrl} autoPlay loop />
            )}
          </div>
        )}

        {/* Canvas Area */}
        <div
          className="w-full h-full flex flex-col items-center justify-center p-0 text-center overflow-hidden relative"
          style={{
            backgroundColor:
              current.mediaType === "text"
                ? current.backgroundColor || "#0f172a"
                : "#000000",
          }}
        >
          {current.isReshare && current.reshareSnapshot ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowReshareAuthorBadge((prev) => !prev);
              }}
              className="w-[85%] max-h-[65%] rounded-2xl overflow-hidden border border-white/25 bg-black/50 shadow-2xl flex flex-col relative cursor-pointer active:scale-98 transition pointer-events-auto"
            >
              <div className="p-2.5 bg-black/50 backdrop-blur-md flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar
                    src={current.reshareSnapshot.authorAvatar}
                    alt={current.reshareSnapshot.authorName}
                    size="xs"
                  />
                  <span className="text-[11px] font-bold text-white truncate font-mono">
                    @
                    {current.reshareSnapshot.authorUsername ||
                      current.reshareSnapshot.authorName}
                  </span>
                </div>
                <span className="text-[9px] text-white/70 font-mono bg-white/10 px-1.5 py-0.5 rounded">
                  Original
                </span>
              </div>

              <div
                className="flex-1 min-h-[170px] flex items-center justify-center p-4 text-center overflow-hidden"
                style={{
                  backgroundColor:
                    current.reshareSnapshot.mediaType === "text"
                      ? current.reshareSnapshot.backgroundColor || "#0284C7"
                      : "#000000",
                }}
              >
                {current.reshareSnapshot.mediaType === "text" ? (
                  <p
                    className="text-sm font-bold line-clamp-4 leading-relaxed"
                    style={{
                      color: current.reshareSnapshot.textColor || "#ffffff",
                    }}
                  >
                    "{current.reshareSnapshot.text}"
                  </p>
                ) : current.reshareSnapshot.mediaUrl ? (
                  <img
                    src={resolveMediaUrl(current.reshareSnapshot.mediaUrl)}
                    alt="Original"
                    className="w-full h-full object-cover max-h-[240px]"
                  />
                ) : null}
              </div>

              {showReshareAuthorBadge && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUsernameForProfile(
                      current.reshareSnapshot.authorUsername ||
                        current.reshareSnapshot.authorName
                    );
                  }}
                  className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-3 animate-fadeIn"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-xs shadow-xl hover:scale-105 transition">
                    <FiUser size={14} />
                    <span>
                      View @
                      {current.reshareSnapshot.authorUsername ||
                        current.reshareSnapshot.authorName}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/80">
                    Tap to view posts, followers & profile
                  </span>
                </div>
              )}
            </div>
          ) : current.mediaType === "text" ? (
            <p
              className={`text-2xl font-bold leading-relaxed px-4 break-words ${
                current.hasTextHighlight
                  ? "px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-sm"
                  : ""
              }`}
              style={{
                color: current.textColor || "#ffffff",
                fontFamily: current.fontFamily || "sans-serif",
              }}
            >
              {current.text}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full relative bg-black">
              {current.mediaUrl ? (
                <img
                  src={resolveMediaUrl(current.mediaUrl)}
                  alt="Story"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-white/50 text-xs">No media found</div>
              )}
              {current.text && (
                <div className="absolute bottom-20 inset-x-4 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                  {current.text}
                </div>
              )}
            </div>
          )}

          {current.isReshare && current.overlayText && (
            <div className="absolute bottom-16 inset-x-4 z-20 pointer-events-none">
              <p
                className={`text-base font-bold px-3 py-1.5 rounded-xl inline-block bg-black/60 backdrop-blur-sm ${
                  current.hasTextHighlight ? "border border-white/20" : ""
                }`}
                style={{
                  color: current.textColor || "#ffffff",
                  fontFamily: current.fontFamily || "sans-serif",
                }}
              >
                {current.overlayText}
              </p>
            </div>
          )}

          {current.stickers && current.stickers.length > 0 && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {current.stickers.map((st, i) => (
                <div
                  key={st._id || i}
                  style={{
                    position: "absolute",
                    left: `${st.x || 50}%`,
                    top: `${st.y || 50}%`,
                    transform: `translate(-50%, -50%) scale(${st.scale || 1})`,
                  }}
                  className="pointer-events-auto"
                >
                  <InteractiveSticker
                    sticker={st}
                    statusId={current._id}
                    isOwn={isOwn}
                    onOpenProfile={(rawUser) =>
                      setSelectedUsernameForProfile(rawUser)
                    }
                    onMentionTap={(rawUser) =>
                      setSelectedUsernameForProfile(rawUser)
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {isMentionedInCurrentStory && !isOwn && (
            <button
              type="button"
              onClick={handleOpenStudioForReshare}
              className="absolute bottom-16 left-4 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/25 hover:bg-white/35 text-white font-bold text-[11px] backdrop-blur-md border border-white/30 shadow-2xl transition active:scale-95 pointer-events-auto"
            >
              <FiShare2 size={13} className="text-pink-400" />
              <span>Add to your story</span>
            </button>
          )}

          {!isMentionedInCurrentStory &&
            !isOwn &&
            mentionedUsernames.length > 0 && (
              <div className="absolute bottom-16 left-4 z-30 pointer-events-auto flex items-center gap-1">
                {mentionedUsernames.map((uName) => (
                  <button
                    key={uName}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUsernameForProfile(uName);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white/90 font-mono text-[10px] backdrop-blur-md border border-white/20 shadow-md transition"
                  >
                    <FiAtSign size={10} className="text-cyan-400" />
                    <span>{uName}</span>
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Bottom Actions */}
        {isOwn ? (
          <div className="absolute bottom-4 inset-x-0 z-30 flex flex-col items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowViewers(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg"
            >
              <FiEye size={14} className="text-cyan-400" />
              <span>{current.viewers?.length || 0} views</span>
            </button>
          </div>
        ) : (
          <div
            className="absolute bottom-4 inset-x-3 z-30 flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowReactionSheet(true);
            }}
          >
            <span className="flex-1 text-xs text-white/60">
              Reply or swipe up to react...
            </span>
            <FiChevronUp size={16} className="text-white/60 animate-bounce" />
          </div>
        )}

        {/* Reactions Drawer */}
        {showReactionSheet && (
          <div
            className="absolute inset-x-0 bottom-0 bg-[#0d131f]/95 backdrop-blur-xl border-t border-slate-800 z-40 p-5 rounded-t-3xl flex flex-col gap-4 animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Quick Reactions
              </span>
              <button
                type="button"
                onClick={() => setShowReactionSheet(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="flex justify-around py-1">
              {STATUS_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReply(emoji)}
                  className="hover:scale-130 active:scale-95 transition-transform text-2xl"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full border border-white/20">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                placeholder="Send a direct reply..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-400 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleSendReply()}
                className="text-cyan-400 hover:text-white p-1"
              >
                <FiSend size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Viewers Drawer */}
        {showViewers && (
          <div
            className="absolute inset-x-0 bottom-0 max-h-72 bg-[#0d131f]/95 backdrop-blur-md border-t border-slate-800 z-40 p-4 rounded-t-3xl flex flex-col overflow-y-auto animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiEye className="text-cyan-400" /> Viewed by (
                {current.viewers?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => setShowViewers(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {current.viewers && current.viewers.length > 0 ? (
                current.viewers.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/40"
                  >
                    <Avatar
                      src={v.user?.avatar}
                      alt={v.user?.fullName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-white truncate">
                        {v.user?.fullName || "User"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatLastSeen(v.viewedAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  No views yet
                </p>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-0 top-16 bottom-24 w-1/3 z-20 opacity-0"
        />
        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-16 bottom-24 w-1/3 z-20 opacity-0"
        />

        {selectedUsernameForProfile && (
          <UserProfileModal
            username={selectedUsernameForProfile}
            onClose={() => setSelectedUsernameForProfile(null)}
          />
        )}
      </div>
    </div>
  );
};

export default StatusViewer;