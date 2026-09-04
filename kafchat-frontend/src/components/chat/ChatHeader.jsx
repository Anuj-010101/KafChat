import React from "react";
import {
  FiArrowLeft,
  FiPhone,
  FiVideo,
  FiInfo,
  FiLock,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";
import { formatLastSeen } from "../../utils/formatTime";

const ChatHeader = ({ onOpenInfo, onStartCall }) => {
  const { user } = useAuth();
  const { activeChat, closeChat } = useChat();

  const currentUserId = (user?._id || user?.id)?.toString();
  const isGroup = Boolean(activeChat?.isGroupChat);
  const isCloud = Boolean(activeChat?.isSavedCloud);

  const other = activeChat?.participants?.find(
    (p) => (p?._id || p)?.toString() !== currentUserId
  );

  const isOtherOnline = Boolean(other?.isOnline) && !Boolean(other?.isGhostModeActive);
  const isLocked = Boolean(activeChat?.isLocked);

  return (
    <div className="h-16 px-4 py-2.5 theme-panel-bg border-b theme-border flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left Section (Back + User Info) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={closeChat}
          className="sm:hidden p-1.5 rounded-xl theme-soft-bg theme-text hover:opacity-80"
        >
          <FiArrowLeft size={18} />
        </button>

        <div
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
          onClick={onOpenInfo}
        >
          <div className="relative shrink-0">
            <Avatar
              src={isGroup ? activeChat.groupAvatar : other?.avatar}
              alt={isGroup ? activeChat.chatName : other?.fullName}
              size="sm"
            />
            {!isGroup && !isCloud && isOtherOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 theme-panel-bg" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold theme-text truncate">
                {isCloud
                  ? "Saved Messages"
                  : isGroup
                  ? activeChat.chatName
                  : other?.fullName || "User"}
              </span>
              {other?.isVIP && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[8px] font-black">
                  PRO
                </span>
              )}
              {isLocked && (
                <FiLock size={11} className="text-amber-400" title="Locked Chat" />
              )}
            </div>
            <span className="text-[10px] theme-text-muted font-mono truncate">
              {isCloud
                ? "Personal Cloud Storage"
                : isGroup
                ? `${activeChat.participants?.length || 0} members`
                : isOtherOnline
                ? "Online"
                : other?.lastSeen
                ? `Last seen ${formatLastSeen(other.lastSeen)}`
                : "Offline"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Section (Calls & Info Button) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isCloud && (
          <>
            <button
              type="button"
              onClick={() => onStartCall && onStartCall(other, activeChat._id, "audio")}
              className="p-2 rounded-xl theme-soft-bg theme-text-muted hover:theme-accent-text transition"
              title="Voice Call"
            >
              <FiPhone size={16} />
            </button>

            <button
              type="button"
              onClick={() => onStartCall && onStartCall(other, activeChat._id, "video")}
              className="p-2 rounded-xl theme-soft-bg theme-text-muted hover:theme-accent-text transition"
              title="Video Call"
            >
              <FiVideo size={16} />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onOpenInfo}
          className="p-2 rounded-xl theme-soft-bg theme-text-muted hover:theme-text transition"
          title="Chat Profile & Info Drawer"
        >
          <FiInfo size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;