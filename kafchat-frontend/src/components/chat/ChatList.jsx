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
      <div className="flex-1 p-4 flex flex-col gap-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-3 p-2 rounded-2xl animate-pulse">
            <div className="w-12 h-12 rounded-full theme-soft-bg" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-28 rounded theme-soft-bg" />
              <div className="h-2.5 w-40 rounded theme-soft-bg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter out any leftover self-chats and keep only real chats + Saved Messages
  const visibleChats = (chats || []).filter((c) => c && !c.isSelfChat);

  if (visibleChats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xs theme-text-muted">No conversations yet.</p>
        <p className="text-[11px] theme-text-muted mt-1">Search for a user to start chatting.</p>
      </div>
    );
  }

  const handleTogglePin = async (e, chatId) => {
    e.stopPropagation();
    try {
      const { data } = await api.patch(`/chats/${chatId}/pin`);
      toast.success(data.message || "Favorite updated!");
      if (fetchChats) fetchChats();
    } catch {
      toast.error("Failed to update favorite");
    }
  };

  // Sort Order: Saved Cloud -> Favorites / Pinned -> Latest Active
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
    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin flex flex-col gap-1 select-none">
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
        if (isCloud) displayName = "Saved Messages (Cloud Vault)";
        else if (isGroup) displayName = chat.groupName || chat.chatName || "Group";
        else displayName = otherUser?.fullName || otherUser?.username || "User";

        const isOnline = Boolean(otherUser?.isOnline);
        const isActive = activeChat?._id === chat._id;
        const unread = Number(chat.unreadCount) || 0;

        return (
          <div
            key={chat._id}
            onClick={() => onSelectChat(chat)}
            className={`group/item flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
              isActive
                ? "theme-accent-tint border theme-accent-border shadow-sm"
                : "hover:theme-soft-bg"
            }`}
          >
            {/* Avatar with Cloud Vault or Profile DP */}
            <div className="relative shrink-0">
              {isCloud ? (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <FiCloud size={20} />
                </div>
              ) : (
                <Avatar
                  src={isGroup ? chat.groupAvatar : otherUser?.avatar}
                  alt={displayName}
                  online={isOnline}
                  size="md"
                />
              )}

              {isDisappearing && (
                <div
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center text-sky-400 shadow"
                  title="Disappearing On"
                >
                  <FiClock size={10} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs truncate flex items-center gap-1.5 ${
                    isActive ? "font-bold theme-accent-text" : "font-semibold theme-text"
                  }`}
                >
                  {displayName}
                  {isPinned && <FiStar size={11} className="fill-amber-400 text-amber-400" title="Favorite" />}
                  {isCloud && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 font-mono text-[9px] font-bold">
                      GB VAULT
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
                <p className="text-[11px] theme-text-muted truncate pr-2">
                  {chat.lastMessage
                    ? chat.lastMessage.text ||
                      (chat.lastMessage.mediaType === "poll"
                        ? "📊 Poll"
                        : `📎 ${chat.lastMessage.mediaType || "Media"}`)
                    : isCloud
                    ? "Store files up to GBs (Videos, ISOs, Docs)..."
                    : "Tap to start conversation"}
                </p>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isCloud && (
                    <button
                      type="button"
                      onClick={(e) => handleTogglePin(e, chat._id)}
                      className={`p-1 rounded-full hover:theme-soft-bg transition ${
                        isPinned
                          ? "opacity-100 text-amber-400"
                          : "opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-amber-400"
                      }`}
                      title={isPinned ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <FiStar size={12} className={isPinned ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                  )}

                  {unread > 0 && (
                    <span className="px-1.5 py-0.2 min-w-[18px] text-[10px] font-bold rounded-full theme-accent-bg text-center shrink-0 shadow-sm text-white">
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