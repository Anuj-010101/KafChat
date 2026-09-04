import Avatar from "../common/Avatar";
import { FiLock } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";

const formatTime = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

const ChatListItem = ({ chat, active, onClick }) => {
  const { user } = useAuth();

  if (!chat) return null;

  const isGroup = Boolean(chat.isGroupChat);
  const otherUser = isGroup
    ? null
    : Array.isArray(chat.participants)
    ? chat.participants.find(
        (p) => (p?._id || p)?.toString() !== (user?._id || user?.id)?.toString()
      )
    : null;

  const displayName = isGroup
    ? chat.groupName || chat.chatName || "Group"
    : otherUser?.fullName || otherUser?.username || "User";
  const avatarSrc = isGroup ? chat.groupAvatar : otherUser?.avatar;
  const isOnline = Boolean(otherUser?.isOnline);
  const isLocked = Boolean(chat.lockedBy?.includes(user?._id));

  const unreadCount = Number(chat.unreadCount) || 0;
  const hasUnread = unreadCount > 0;

  const lastMsg = chat.lastMessage;
  let snippet = "No messages yet";
  if (lastMsg) {
    if (lastMsg.mediaType === "poll") snippet = `📊 Poll: ${lastMsg.pollData?.question || ""}`;
    else if (lastMsg.mediaType === "image") snippet = "📷 Photo";
    else if (lastMsg.mediaType === "audio") snippet = "🎙️ Voice note";
    else if (lastMsg.mediaType === "document") snippet = "📎 Document";
    else snippet = lastMsg.text || "";
  }

  return (
    <div
      onClick={onClick}
      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors border-b border-gray-700/20 ${
        active
          ? "theme-soft-bg border-l-4 border-sky-400"
          : "hover:opacity-90 theme-panel-bg hover:theme-soft-bg/40"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar src={avatarSrc} alt={displayName} online={isOnline} size="md" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs truncate flex items-center gap-1 ${
              hasUnread ? "font-bold theme-text" : "font-medium theme-text"
            }`}
          >
            {isLocked && <FiLock size={11} className="theme-text-muted shrink-0" />}
            {displayName}
          </span>
          {chat.updatedAt && (
            <span
              className={`text-[10px] font-mono shrink-0 ${
                hasUnread ? "text-sky-400 font-semibold" : "theme-text-muted"
              }`}
            >
              {formatTime(chat.updatedAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs truncate max-w-[170px] ${
              hasUnread ? "font-semibold theme-text" : "theme-text-muted"
            }`}
          >
            {snippet}
          </p>

          {hasUnread && (
            <span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full bg-sky-500 text-white text-[11px] font-black flex items-center justify-center shadow-md animate-bubbleIn">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;