import { FiCloud, FiClock, FiStar } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { formatTimeAgo } from "../../utils/formatTime";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { useChat } from "../../hooks/useChat";
import toast from "react-hot-toast";

const ChatList = ({ chats = [], activeChat, onSelectChat, loading }) => {
  const { user } = useAuth();
  const { fetchChats } = useChat();
  const currentUserId = (user?._id || user?.id)?.toString();

  if (loading) {
    return (
      <div className="flex-1 p-2 flex flex-col gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2 px-2 py-1 rounded-xl animate-pulse">
            <div className="w-8 h-8 rounded-full theme-soft-bg" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="h-2.5 w-24 rounded theme-soft-bg" />
              <div className="h-2 w-32 rounded theme-soft-bg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visibleChats = (chats || []).filter((c) => c && !c.isSelfChat);

  if (visibleChats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-xs theme-text-muted">No conversations yet.</p>
        <p className="text-[11px] theme-text-muted mt-1">Search for a user to start chatting.</p>
      </div>
    );
  }

  // 🚀 FIXED: Pin/Favorite click handler with explicit stopPropagation
  const handleTogglePin = async (e, chatId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const { data } = await api.patch(`/chats/${chatId}/pin`);
      toast.success(data.message || "Favorite updated!");
      if (fetchChats) fetchChats();
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  const sortedChats = [...visibleChats].sort((a, b) => {
    if (a.isSavedCloud) return -1;
    if (b.isSavedCloud) return 1;

    const isAPinned =
      a.isPinned ||
      a.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
    const isBPinned =
      b.isPinned ||
      b.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);

    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;

    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="flex-1 overflow-y-auto px-1 py-1 scrollbar-thin flex flex-col gap-1 select-none">
      {sortedChats.map((chat) => {
        const isGroup = Boolean(chat.isGroupChat);
        const isCloud = Boolean(chat.isSavedCloud);
        const isPinned =
          chat.isPinned ||
          chat.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
        const isDisappearing = chat.disappearingTimer && chat.disappearingTimer !== "off";

        const otherUser =
          isGroup || isCloud
            ? null
            : chat.participants?.find(
                (p) => (p?._id || p)?.toString() !== currentUserId
              );

        let displayName = "";
        if (isCloud) displayName = "Saved Messages";
        else if (isGroup) displayName = chat.groupName || chat.chatName || "Group";
        else displayName = otherUser?.fullName || otherUser?.username || "User";

        const isOnline = Boolean(otherUser?.isOnline);
        const isActive = activeChat?._id === chat._id;
        const unread = Number(chat.unreadCount) || 0;

        return (
          <div
            key={chat._id}
            onClick={() => onSelectChat(chat)}
            className={`group/item flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
              isActive
                ? "theme-accent-tint border theme-accent-border shadow-sm"
                : "hover:theme-soft-bg"
            }`}
          >
            {/* Compact Avatar */}
            <div className="relative shrink-0">
              {isCloud ? (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <FiCloud size={15} />
                </div>
              ) : (
                <Avatar
                  src={isGroup ? chat.groupAvatar : otherUser?.avatar}
                  alt={displayName}
                  online={isOnline}
                  size="sm"
                />
              )}

              {isDisappearing && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-sky-400"
                  title="Disappearing On"
                >
                  <FiClock size={8} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs truncate flex items-center gap-1 ${
                    isActive ? "font-bold theme-accent-text" : "font-semibold theme-text"
                  }`}
                >
                  {displayName}
                  {isPinned && <FiStar size={10} className="fill-amber-400 text-amber-400 shrink-0" title="Favorite" />}
                  {isCloud && (
                    <span className="px-1 py-0.1 rounded bg-indigo-500/15 text-indigo-400 font-mono text-[8px] font-bold">
                      VAULT
                    </span>
                  )}
                </span>
                {chat.lastMessage && (
                  <span className="text-[10px] theme-text-muted shrink-0 ml-1">
                    {formatTimeAgo(chat.lastMessage.createdAt || chat.updatedAt)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] theme-text-muted truncate pr-1">
                  {chat.lastMessage
                    ? chat.lastMessage.text ||
                      (chat.lastMessage.mediaType === "poll"
                        ? "📊 Poll"
                        : `📎 ${chat.lastMessage.mediaType || "Media"}`)
                    : isCloud
                    ? "Store files up to GBs..."
                    : "Tap to start conversation"}
                </p>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 🚀 FIXED: Dedicated clickable pin button with stopPropagation */}
                  {!isCloud && (
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(e, chat._id)}
                      className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition z-10"
                      title={isPinned ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <FiStar
                        size={13}
                        className={isPinned ? "fill-amber-400 text-amber-400" : "text-slate-400 hover:text-amber-400"}
                      />
                    </button>
                  )}

                  {unread > 0 && (
                    <span className="px-1.5 py-0.1 min-w-[16px] text-[9px] font-bold rounded-full theme-accent-bg text-center shrink-0 text-white">
                      {unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;