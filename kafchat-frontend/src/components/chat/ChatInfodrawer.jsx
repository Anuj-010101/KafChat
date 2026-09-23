import { useState, useRef, useEffect } from "react";
import {
  FiX,
  FiCamera,
  FiEdit2,
  FiCheck,
  FiShield,
  FiLogOut,
  FiPhone,
  FiCalendar,
  FiInfo,
  FiDownload,
  FiImage,
  FiLink,
  FiFileText,
  FiFilm,
  FiZap,
  FiClock,
  FiLock,
  FiUnlock,
  FiBellOff,
  FiBell,
  FiShare2,
  FiSlash,
  FiAlertTriangle,
  FiExternalLink,
  FiTrash2,
  FiXCircle,
  FiEye,
  FiArchive,
  FiKey,
  FiUsers,
  FiMessageSquare,
  FiGrid,
  FiBookmark,
  FiStar,
  FiUserPlus,
  FiUserMinus,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import DualProfileBanner from "../common/DualProfileBanner";
import ChatWallpaperModal from "./ChatWallpaperModal";
import Button from "../common/Button";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";
import { chatService } from "../../services/chatService";
import api from "../../services/api";
import toast from "react-hot-toast";

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const MUTE_OPTIONS = [
  { id: "8h", label: "8 Hours", desc: "Mute notifications for 8 hours" },
  { id: "24h", label: "24 Hours", desc: "Mute notifications for full day" },
  { id: "always", label: "Always", desc: "Mute until you turn it back on" },
];

const ChatInfoDrawer = ({ isOpen, onClose, messages, onStartCall }) => {
  const { user, setChatLockPin: setPinRemote } = useAuth();
  const {
    activeChat,
    setActiveChat,
    setChats,
    setMessages,
    refreshChats,
    updateGroupInfo,
    removeGroupMember,
    toggleLock,
    startChatWithUser,
  } = useChat();

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [mediaTab, setMediaTab] = useState("media");
  const [showFullDp, setShowFullDp] = useState(false);

  // Mute State & Modal
  const [isMuted, setIsMuted] = useState(Boolean(activeChat?.isMuted));
  const [muteDuration, setMuteDuration] = useState(activeChat?.muteDuration || "off");
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [selectedMuteOption, setSelectedMuteOption] = useState("8h");

  // Privacy & Lifecycle Controls
  const [disappearingTime, setDisappearingTime] = useState(activeChat?.disappearingTimer || "off");
  const [isArchived, setIsArchived] = useState(Boolean(activeChat?.isArchived));
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [showDisappearModal, setShowDisappearModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Followers, Following & User Posts State inside Chat Profile Drawer
  const [drawerFollowers, setDrawerFollowers] = useState([]);
  const [drawerFollowing, setDrawerFollowing] = useState([]);
  const [drawerUserPosts, setDrawerUserPosts] = useState([]);
  const [drawerSocialModal, setDrawerSocialModal] = useState(null);

  // Instagram-Style Profile Inspector Popup State
  const [inspectedProfileUser, setInspectedProfileUser] = useState(null);
  const [inspectedUserPosts, setInspectedUserPosts] = useState([]);

  // Lock & Secret Vault PIN States
  const [showLockPrompt, setShowLockPrompt] = useState(false);
  const [showSetCodeModal, setShowSetCodeModal] = useState(false);
  const [lockPinInput, setLockPinInput] = useState("");
  const [newVaultCode, setNewVaultCode] = useState("");
  const [targetActionAfterSet, setTargetActionAfterSet] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeChat) {
      setGroupName(activeChat.groupName || activeChat.chatName || "");
      setIsMuted(Boolean(activeChat.isMuted));
      setMuteDuration(activeChat.muteDuration || "off");
      setDisappearingTime(activeChat.disappearingTimer || "off");
      setIsArchived(Boolean(activeChat.isArchived));

      const currentUserId = (user?._id || user?.id)?.toString();
      const pinnedStatus =
        activeChat.isPinned ||
        activeChat.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
      setIsPinned(Boolean(pinnedStatus));

      const favoriteStatus =
        activeChat.isFavorite ||
        activeChat.favoriteBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
      setIsFavorite(Boolean(favoriteStatus));

      const targetOtherUser = activeChat.isGroupChat
        ? null
        : activeChat.participants?.find((p) => (p._id || p)?.toString() !== currentUserId);

      if (targetOtherUser) {
        const targetId = targetOtherUser._id || targetOtherUser;

        setDrawerUserPosts([]);

        api.get(`/users/${targetId}/network`)
          .then(({ data }) => {
            setDrawerFollowers(data.followers || []);
            setDrawerFollowing(data.following || []);
            const freshFollowingCheck = (data.followers || []).some(
              (f) => (f?._id || f)?.toString() === currentUserId
            );
            setIsFollowing(freshFollowingCheck);
          })
          .catch(() => {
            setDrawerFollowers(targetOtherUser.followers || []);
            setDrawerFollowing(targetOtherUser.following || []);
            const fallbackCheck = (targetOtherUser.followers || []).some(
              (f) => (f?._id || f)?.toString() === currentUserId
            );
            setIsFollowing(fallbackCheck);
          });

        api.get(`/users/${targetId}/profile`)
          .then(({ data }) => {
            if (data.posts) {
              setDrawerUserPosts(data.posts);
            }
          })
          .catch(() => {
            setDrawerUserPosts([]);
          });
      }
    }
  }, [activeChat, user]);

  if (!isOpen || !activeChat) return null;

  const isGroup = activeChat.isGroupChat;
  const isLocked = Boolean(activeChat.isLocked);
  const isAutoDeleteOnView = disappearingTime === "after_view";
  const currentUserId = (user?._id || user?.id)?.toString();
  const hasUserCode = Boolean(user?.lockPin);

  const isAdmin =
    isGroup &&
    (activeChat.groupAdmins?.some((a) => (a._id || a)?.toString() === currentUserId) ||
      (activeChat.groupAdmin?._id || activeChat.groupAdmin)?.toString() === currentUserId);

  const otherUser = isGroup
    ? null
    : activeChat.participants?.find((p) => (p._id || p)?.toString() !== currentUserId);

  const currentAvatarSrc = isGroup ? activeChat.groupAvatar : otherUser?.avatar;
  const currentDisplayName = isGroup
    ? activeChat.groupName || activeChat.chatName
    : otherUser?.fullName;

  const mediaList =
    messages?.filter((m) => {
      if (!m.mediaUrl || m.mediaType !== "image") return false;
      const url = m.mediaUrl.toLowerCase();
      const isBitmojiOrSticker =
        m.isBitmoji ||
        m.isSticker ||
        url.includes("bitmoji") ||
        url.includes("sticker") ||
        url.includes("giphy") ||
        url.includes("tenor") ||
        m.mediaType === "sticker" ||
        m.mediaType === "bitmoji";
      return !isBitmojiOrSticker;
    }) || [];

  const reelsList = messages?.filter((m) => m.mediaUrl && (m.mediaType === "video" || m.mediaUrl.endsWith(".mp4"))) || [];
  const docsList = messages?.filter((m) => m.mediaUrl && m.mediaType === "document") || [];
  const snapsList = messages?.filter((m) => m.isSnap || m.mediaType === "snap") || [];

  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const linksList =
    messages
      ?.filter((m) => m.text && m.text.match(linkRegex))
      ?.map((m) => {
        const urls = m.text.match(linkRegex);
        return { url: urls[0], sender: m.sender?.fullName, date: m.createdAt };
      }) || [];

  const handleInspectUserProfile = async (targetUserItem) => {
    const targetId = typeof targetUserItem === "object" ? (targetUserItem._id || targetUserItem.id) : targetUserItem;
    if (!targetId) return;

    try {
      setDrawerSocialModal(null);
      const { data } = await api.get(`/users/${targetId}/profile`);
      setInspectedProfileUser(data.user || targetUserItem);
      setInspectedUserPosts(data.posts || []);
    } catch {
      try {
        const { data: socialData } = await api.get(`/social/user/${targetId}/posts`);
        setInspectedProfileUser(targetUserItem);
        setInspectedUserPosts(socialData.posts || socialData.userPosts || []);
      } catch {
        setInspectedProfileUser(typeof targetUserItem === "object" ? targetUserItem : { _id: targetId, fullName: "User", username: "user" });
        setInspectedUserPosts([]);
      }
    }
  };

  const handleToggleFollow = async () => {
    const targetId = otherUser?._id || otherUser;
    if (!targetId) return;
    try {
      if (isFollowing) {
        await api.patch(`/users/unfollow/${targetId}`);
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        await api.post(`/users/follow/${targetId}`);
        setIsFollowing(true);
        toast.success("Following");
      }
      if (refreshChats) refreshChats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update follow status");
    }
  };

  const handleAvatarChange = async (e) => {
    e.stopPropagation();
    const file = e.target.files && e.target.files[0];
    if (file && isGroup) {
      const reader = new FileReader();
      reader.onload = async () => {
        await updateGroupInfo(activeChat._id, { groupAvatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = async () => {
    if (!groupName.trim()) return;
    await updateGroupInfo(activeChat._id, { name: groupName.trim() });
    setIsEditingName(false);
  };

  const handleApplyMute = async (duration) => {
    try {
      const { data } = await chatService.toggleMute(activeChat._id, duration);
      setIsMuted(data.isMuted);
      setMuteDuration(data.muteDuration);
      setShowMuteModal(false);
      toast.success(data.message || (data.isMuted ? "Chat muted" : "Chat unmuted"));
    } catch {
      toast.error("Failed to update mute settings");
    }
  };

  const handleTogglePin = async () => {
    try {
      const { data } = await api.patch(`/chats/${activeChat._id}/pin`);
      setIsPinned(data.isPinned);
      toast.success(data.message || "Pin status updated!");
      if (setActiveChat) setActiveChat((prev) => ({ ...prev, isPinned: data.isPinned }));
      if (refreshChats) refreshChats();
    } catch {
      toast.error("Failed to update pin status");
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const { data } = await api.patch(`/chats/${activeChat._id}/favorite`);
      setIsFavorite(data.isFavorite);
      toast.success(data.message || "Favorite status updated!");
      if (setActiveChat) setActiveChat((prev) => ({ ...prev, isFavorite: data.isFavorite }));
      if (refreshChats) refreshChats();
    } catch {
      toast.error("Failed to update favorite status");
    }
  };

  const handleArchiveClick = async () => {
    if (!hasUserCode && !isArchived) {
      setTargetActionAfterSet("archive");
      setNewVaultCode("");
      setShowSetCodeModal(true);
      return;
    }

    try {
      const { data } = await api.patch(`/chats/${activeChat._id}/archive`);
      setIsArchived(data.isArchived);
      toast.success(
        data.isArchived
          ? `Chat hidden in Vault! Search $${user?.lockPin || "code"} to unhide.`
          : "Chat unarchived"
      );
      if (setActiveChat) setActiveChat((prev) => ({ ...prev, isArchived: data.isArchived }));
      if (setChats) {
        setChats((prev) =>
          prev.map((c) => (c._id === activeChat._id ? { ...c, isArchived: data.isArchived } : c))
        );
      }
      if (refreshChats) refreshChats();
      onClose();
    } catch {
      toast.error("Failed to update archive status");
    }
  };

  const handleLockClick = () => {
    if (!hasUserCode && !isLocked) {
      setTargetActionAfterSet("lock");
      setNewVaultCode("");
      setShowSetCodeModal(true);
      return;
    }

    setLockPinInput("");
    setShowLockPrompt(true);
  };

  const handleSaveVaultCode = async (e) => {
    e.preventDefault();
    const clean = newVaultCode.replace(/\D/g, "");
    if (clean.length < 4) {
      toast.error("Code must be at least 4 digits (e.g. 1234)");
      return;
    }

    try {
      setActionLoading(true);
      await api.patch("/auth/chat-lock-pin", { pin: clean });
      if (setPinRemote) await setPinRemote(clean);

      const localUser = JSON.parse(localStorage.getItem("kafchat_user") || "{}");
      localUser.lockPin = clean;
      localStorage.setItem("kafchat_user", JSON.stringify(localUser));

      toast.success(`Vault Code set! Search $${clean} to find your chats 🔐`);
      setShowSetCodeModal(false);

      if (targetActionAfterSet === "archive") {
        const { data } = await api.patch(`/chats/${activeChat._id}/archive`);
        setIsArchived(data.isArchived);
        toast.success(`Chat Archived! Type $${clean} in Search bar to open it anytime.`);
        if (refreshChats) refreshChats();
        onClose();
      } else if (targetActionAfterSet === "lock") {
        await toggleLock(activeChat._id, clean);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set vault code");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmChatLock = async (e) => {
    e.preventDefault();
    if (!lockPinInput || lockPinInput.length < 4) {
      toast.error("Please enter your 4-6 digit PIN");
      return;
    }

    try {
      const clean = lockPinInput.replace(/\D/g, "");
      const success = await toggleLock(activeChat._id, clean);
      if (success) {
        setShowLockPrompt(false);
        setLockPinInput("");
        onClose();
      }
    } catch {
      toast.error("Failed to lock/unlock chat");
    }
  };

  const handleToggleAutoDeleteOnView = async () => {
    const nextTimer = isAutoDeleteOnView ? "off" : "after_view";
    try {
      await chatService.setDisappearingTimer(activeChat._id, nextTimer);
      setDisappearingTime(nextTimer);
      toast.success(
        nextTimer === "after_view"
          ? "Auto-delete on view enabled (Messages delete once seen)"
          : "Auto-delete on view disabled"
      );
      if (refreshChats) refreshChats();
    } catch {
      toast.error("Failed to update auto-delete timer");
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator
        .share({
          title: currentDisplayName,
          text: `Chat with ${currentDisplayName} on KafChat!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`Contact: ${currentDisplayName} (@${otherUser?.username || "kafchat"})`);
      toast.success("Contact details copied to clipboard!");
      setShowShareModal(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm("Are you sure you want to clear all messages in this conversation?")) return;
    try {
      setActionLoading(true);
      await chatService.clearChat(activeChat._id);
      if (setMessages) setMessages([]);
      toast.success("Chat messages cleared");
      if (refreshChats) refreshChats();
    } catch {
      toast.error("Failed to clear chat");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm("Are you sure you want to delete this entire conversation?")) return;
    try {
      setActionLoading(true);
      await chatService.deleteConversation(activeChat._id);
      if (setActiveChat) setActiveChat(null);
      if (setChats) setChats((prev) => prev.filter((c) => c._id !== activeChat._id));
      toast.success("Conversation deleted");
      onClose();
    } catch {
      toast.error("Failed to delete conversation");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-96 theme-panel-bg border-l theme-border z-50 flex flex-col shadow-2xl animate-bubbleIn select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header with Non-overlapping Close Button */}
        <div className="h-16 px-5 border-b theme-border flex items-center justify-between theme-soft-bg/50 shrink-0 relative z-20">
          <h3 className="text-sm font-semibold theme-text flex items-center gap-2">
            <FiInfo className="theme-accent-text" />
            {isGroup ? "Group Info" : "Contact Profile"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full theme-text-muted hover:theme-text theme-soft-bg transition cursor-pointer"
            title="Close Drawer"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-4">
          {!isGroup && otherUser ? (
            <div className="flex flex-col items-center">
              <DualProfileBanner
                user={otherUser}
                isSelf={false}
                onViewFullDp={() => setShowFullDp(true)}
              />
              <h2 className="text-base font-bold theme-text mt-2 text-center truncate">
                {otherUser.fullName}
              </h2>
              <span className="text-xs theme-accent-text font-mono">
                @{otherUser.username}
              </span>

              {otherUser.bio && (
                <p className="text-xs theme-text-muted italic mt-1 text-center px-2">
                  "{otherUser.bio}"
                </p>
              )}

              {/* Instagram Style Action Buttons Bar (Following/Follow + Message) */}
              <div className="flex items-center gap-2 w-full mt-3">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm ${
                    isFollowing
                      ? "theme-border theme-soft-bg theme-text hover:bg-red-500/10 hover:text-red-500"
                      : "theme-accent-bg text-white border-transparent hover:opacity-90"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <FiUserMinus size={13} /> Following
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={13} /> Follow
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (startChatWithUser && otherUser._id) {
                      startChatWithUser(otherUser._id);
                      onClose();
                    }
                  }}
                  className="flex-1 py-2 rounded-xl theme-soft-bg border theme-border text-xs font-semibold theme-text flex items-center justify-center gap-1.5 hover:opacity-80 transition shadow-sm"
                >
                  <FiMessageSquare size={13} /> Message
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full mt-3 p-2.5 rounded-2xl theme-soft-bg border theme-border text-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold theme-text">{drawerUserPosts.length}</span>
                  <span className="text-[10px] theme-text-muted font-medium">Posts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerSocialModal("followers")}
                  className="flex flex-col items-center hover:opacity-80 transition cursor-pointer"
                >
                  <span className="text-xs font-bold theme-text">{drawerFollowers.length}</span>
                  <span className="text-[10px] theme-accent-text font-semibold">Followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerSocialModal("following")}
                  className="flex flex-col items-center hover:opacity-80 transition cursor-pointer"
                >
                  <span className="text-xs font-bold theme-text">{drawerFollowing.length}</span>
                  <span className="text-[10px] theme-accent-text font-semibold">Following</span>
                </button>
              </div>

              {!otherUser.isPrivateAccount && drawerUserPosts.length > 0 && (
                <div className="w-full mt-3 flex flex-col gap-2">
                  <span className="text-[10px] font-bold theme-text-muted uppercase tracking-wider text-left px-1 flex items-center gap-1">
                    <FiGrid size={11} /> Posts ({drawerUserPosts.length})
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    {drawerUserPosts.map((post, idx) => (
                      <div
                        key={post._id || idx}
                        className="aspect-square rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                        onClick={() => window.open(post.mediaUrl || post.url, "_blank")}
                      >
                        <img src={post.mediaUrl || post.url} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl theme-soft-bg/50 border theme-border">
              <div className="relative group cursor-pointer" onClick={() => setShowFullDp(true)}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <Avatar
                  src={currentAvatarSrc}
                  alt={currentDisplayName}
                  size="xl"
                  className="hover:opacity-90 transition-transform duration-200 group-hover:scale-105"
                />
                {isGroup && isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 p-2 theme-accent-bg text-white rounded-full shadow-lg border-2 theme-border transition"
                    title="Change Group Icon"
                  >
                    <FiCamera size={13} />
                  </button>
                )}
              </div>

              <div className="w-full flex items-center justify-center gap-2">
                {isEditingName && isAdmin ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="flex-1 theme-soft-bg border theme-border rounded-lg px-3 py-1.5 text-sm theme-text outline-none theme-accent-focus"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2 theme-accent-bg rounded-lg text-white"
                    >
                      <FiCheck size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-bold theme-text truncate">
                      {currentDisplayName}
                    </h2>
                    {isGroup && isAdmin && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="theme-text-muted hover:theme-accent-text"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>

              <span className="text-xs theme-accent-text font-mono">
                Group • {activeChat.participants?.length || 0} participants
              </span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-2 py-1">
            <button
              type="button"
              onClick={() => onStartCall && onStartCall(otherUser, activeChat._id, "audio")}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl theme-soft-bg/60 border theme-border hover:theme-soft-bg transition"
            >
              <FiPhone className="theme-accent-text" size={16} />
              <span className="text-[10px] font-semibold theme-text">Audio</span>
            </button>
            <button
              type="button"
              onClick={() => onStartCall && onStartCall(otherUser, activeChat._id, "video")}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl theme-soft-bg/60 border theme-border hover:theme-soft-bg transition"
            >
              <FiFilm className="text-purple-500" size={16} />
              <span className="text-[10px] font-semibold theme-text">Video</span>
            </button>
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl theme-soft-bg/60 border theme-border hover:theme-soft-bg transition"
            >
              <FiShare2 className="text-emerald-500" size={16} />
              <span className="text-[10px] font-semibold theme-text">Share</span>
            </button>
            <button
              type="button"
              onClick={handleLockClick}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl theme-soft-bg/60 border theme-border hover:theme-soft-bg transition"
            >
              {isLocked ? <FiLock className="text-amber-500" size={16} /> : <FiUnlock className="text-slate-400" size={16} />}
              <span className="text-[10px] font-semibold theme-text">{isLocked ? "Locked" : "Lock"}</span>
            </button>
          </div>

          {/* Media Hub */}
          <div className="p-3.5 rounded-2xl theme-soft-bg/50 border theme-border flex flex-col gap-2.5">
            <span className="text-[10px] font-bold theme-text-muted uppercase tracking-wider">
              Media, Links & Docs Hub
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 border-b theme-border text-[11px] font-semibold">
              <button
                onClick={() => setMediaTab("media")}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1 transition ${
                  mediaTab === "media" ? "theme-accent-bg text-white" : "theme-text-muted hover:theme-text"
                }`}
              >
                <FiImage size={12} /> Media ({mediaList.length})
              </button>
              <button
                onClick={() => setMediaTab("links")}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1 transition ${
                  mediaTab === "links" ? "theme-accent-bg text-white" : "theme-text-muted hover:theme-text"
                }`}
              >
                <FiLink size={12} /> Links ({linksList.length})
              </button>
              <button
                onClick={() => setMediaTab("docs")}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1 transition ${
                  mediaTab === "docs" ? "theme-accent-bg text-white" : "theme-text-muted hover:theme-text"
                }`}
              >
                <FiFileText size={12} /> Docs ({docsList.length})
              </button>
              <button
                onClick={() => setMediaTab("reels")}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1 transition ${
                  mediaTab === "reels" ? "theme-accent-bg text-white" : "theme-text-muted hover:theme-text"
                }`}
              >
                <FiFilm size={12} /> Reels ({reelsList.length})
              </button>
              <button
                onClick={() => setMediaTab("snaps")}
                className={`px-2.5 py-1 rounded-xl whitespace-nowrap flex items-center gap-1 transition ${
                  mediaTab === "snaps" ? "theme-accent-bg text-white" : "theme-text-muted hover:theme-text"
                }`}
              >
                <FiZap size={12} /> Snaps ({snapsList.length})
              </button>
            </div>

            <div className="pt-1 min-h-[90px]">
              {mediaTab === "media" && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaList.map((m, idx) => (
                    <img
                      key={idx}
                      src={m.mediaUrl}
                      alt="Shared Media"
                      className="w-full h-20 object-cover rounded-xl border theme-border cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(m.mediaUrl, "_blank")}
                    />
                  ))}
                  {mediaList.length === 0 && (
                    <div className="col-span-3 text-center py-6 text-xs theme-text-muted">
                      No photos shared yet.
                    </div>
                  )}
                </div>
              )}

              {mediaTab === "links" && (
                <div className="flex flex-col gap-2">
                  {linksList.map((l, idx) => (
                    <a
                      key={idx}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl theme-panel-bg border theme-border flex items-center justify-between gap-2 hover:theme-accent-border transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg theme-accent-tint flex items-center justify-center shrink-0">
                          <FiExternalLink size={12} />
                        </div>
                        <span className="text-xs theme-accent-text font-medium truncate">
                          {l.url}
                        </span>
                      </div>
                    </a>
                  ))}
                  {linksList.length === 0 && (
                    <div className="text-center py-6 text-xs theme-text-muted">
                      No web links shared.
                    </div>
                  )}
                </div>
              )}

              {mediaTab === "docs" && (
                <div className="flex flex-col gap-2">
                  {docsList.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl theme-panel-bg border theme-border flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                          <FiFileText size={14} />
                        </div>
                        <span className="text-xs theme-text font-medium truncate">
                          Document_{idx + 1}.pdf
                        </span>
                      </div>
                      <a
                        href={d.mediaUrl}
                        download
                        className="p-1.5 rounded-lg theme-soft-bg theme-text hover:theme-accent-text"
                      >
                        <FiDownload size={14} />
                      </a>
                    </div>
                  ))}
                  {docsList.length === 0 && (
                    <div className="text-center py-6 text-xs theme-text-muted">
                      No documents shared.
                    </div>
                  )}
                </div>
              )}

              {mediaTab === "reels" && (
                <div className="grid grid-cols-3 gap-2">
                  {reelsList.map((r, idx) => (
                    <div
                      key={idx}
                      className="relative w-full h-28 rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                      onClick={() => window.open(r.mediaUrl, "_blank")}
                    >
                      <video src={r.mediaUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white group-hover:scale-110 transition">
                        <FiFilm size={18} />
                      </div>
                    </div>
                  ))}
                  {reelsList.length === 0 && (
                    <div className="col-span-3 text-center py-6 text-xs theme-text-muted">
                      No reels or video clips.
                    </div>
                  )}
                </div>
              )}

              {mediaTab === "snaps" && (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-1.5">
                    <FiZap size={18} />
                  </div>
                  <span className="text-xs font-semibold theme-text">Snap Hub Active</span>
                  <span className="text-[10px] theme-text-muted mt-0.5">
                    View-once media expires after watching.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Privacy & Controls */}
          <div className="p-3.5 rounded-2xl theme-soft-bg/50 border theme-border flex flex-col gap-3">
            <span className="text-[10px] font-bold theme-text-muted uppercase tracking-wider">
              Advanced Privacy & Controls
            </span>

            <div
              onClick={handleTogglePin}
              className="flex items-center justify-between gap-3 py-1 border-b theme-border cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isPinned ? "bg-sky-500/15 text-sky-400" : "bg-slate-500/10 text-slate-400"}`}>
                  <FiBookmark size={13} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">
                    {isPinned ? "Unpin Chat" : "Pin Chat"}
                  </span>
                  <span className="text-[10px] theme-text-muted">
                    {isPinned ? "Pinned to top of sidebar" : "Fix chat at top list"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPinned ? "bg-sky-500/20 text-sky-400" : "theme-text-muted"}`}>
                {isPinned ? "PINNED" : "OFF"}
              </span>
            </div>

            <div
              onClick={handleToggleFavorite}
              className="flex items-center justify-between gap-3 py-1 border-b theme-border cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isFavorite ? "bg-amber-500/15 text-amber-400" : "bg-slate-500/10 text-slate-400"}`}>
                  <FiStar size={13} className={isFavorite ? "fill-amber-400 text-amber-400" : ""} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">
                    {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                  </span>
                  <span className="text-[10px] theme-text-muted">
                    {isFavorite ? "Marked as favorite chat" : "Add to favorites category"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFavorite ? "bg-amber-500/20 text-amber-400" : "theme-text-muted"}`}>
                {isFavorite ? "FAVORITE" : "OFF"}
              </span>
            </div>

            <div
              onClick={() => setShowWallpaperModal(true)}
              className="flex items-center justify-between gap-3 py-1 border-b theme-border cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                  <FiImage size={13} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">Chat Wallpaper</span>
                  <span className="text-[10px] theme-text-muted">Custom background & gallery photo</span>
                </div>
              </div>
              <span className="text-xs theme-text-muted">›</span>
            </div>

            <div
              onClick={() => setShowDisappearModal(true)}
              className="flex items-center justify-between gap-3 py-1 border-b theme-border cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <FiClock size={13} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">Disappearing Messages</span>
                  <span className="text-[10px] theme-text-muted capitalize">
                    {disappearingTime === "off"
                      ? "Off"
                      : disappearingTime === "after_view"
                      ? "Auto-delete after view"
                      : `${disappearingTime} timer`}
                  </span>
                </div>
              </div>
              <span className="text-xs theme-text-muted">›</span>
            </div>

            <div
              onClick={handleArchiveClick}
              className="flex items-center justify-between gap-3 py-1 border-b theme-border cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isArchived ? "bg-cyan-500/15 text-cyan-400" : "bg-slate-500/10 text-slate-400"}`}>
                  <FiArchive size={13} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">
                    {isArchived ? "Unarchive Chat" : "Archive Chat ($Vault)"}
                  </span>
                  <span className="text-[10px] theme-text-muted">
                    {isArchived ? "Chat is archived & hidden" : "Hide in secret search vault ($code)"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isArchived ? "bg-cyan-500/20 text-cyan-400" : "theme-text-muted"}`}>
                {isArchived ? "ARCHIVED" : "OFF"}
              </span>
            </div>

            <div
              onClick={handleLockClick}
              className="flex items-center justify-between gap-3 py-1 border-b theme-border cursor-pointer hover:opacity-80 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isLocked ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/10 text-emerald-500"}`}>
                  {isLocked ? <FiLock size={13} /> : <FiUnlock size={13} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">
                    {isLocked ? "Unlock / Manage Lock" : "Lock This Chat"}
                  </span>
                  <span className="text-[10px] theme-text-muted">
                    {isLocked ? "Chat is secured with PIN" : "Protect with secret master PIN"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLocked ? "bg-amber-500/20 text-amber-400" : "theme-text-muted"}`}>
                {isLocked ? "LOCKED" : "OFF"}
              </span>
            </div>

            <div
              onClick={handleToggleAutoDeleteOnView}
              className="flex items-center justify-between gap-3 py-1 cursor-pointer hover:opacity-85 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAutoDeleteOnView ? "bg-red-500/15 text-red-500" : "bg-slate-500/10 text-slate-400"}`}>
                  <FiEye size={13} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold theme-text">
                    Auto-Delete on View
                  </span>
                  <span className="text-[10px] theme-text-muted">
                    {isAutoDeleteOnView
                      ? "Active: Messages self-destruct once seen"
                      : "Messages stay in chat history"}
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  isAutoDeleteOnView ? "bg-red-500" : "bg-gray-400 dark:bg-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isAutoDeleteOnView ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Conversation Actions */}
          <div className="flex flex-col gap-2 mt-1">
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleClearChat}
              className="w-full py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <FiXCircle size={15} /> Clear Messages
            </button>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDeleteConversation}
              className="w-full py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <FiTrash2 size={15} /> Delete Conversation
            </button>

            {!isGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => toast.error(`Blocked ${currentDisplayName}`)}
                  className="w-full py-2.5 rounded-2xl theme-soft-bg hover:bg-red-500/10 hover:text-red-500 text-xs font-semibold theme-text-muted flex items-center justify-center gap-2 transition"
                >
                  <FiSlash size={15} /> Block {currentDisplayName}
                </button>
                <button
                  type="button"
                  onClick={() => toast.success("Report submitted")}
                  className="w-full py-2.5 rounded-2xl theme-soft-bg hover:bg-red-500/10 hover:text-red-500 text-xs font-semibold theme-text-muted flex items-center justify-center gap-2 transition"
                >
                  <FiAlertTriangle size={15} /> Report Contact
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => removeGroupMember(activeChat._id, currentUserId)}
                className="w-full py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <FiLogOut size={15} /> Exit Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Social Network List Modal (Followers / Following) */}
      {drawerSocialModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setDrawerSocialModal(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-3 max-h-[70vh] animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b theme-border">
              <div className="flex items-center gap-2">
                <FiUsers className="theme-accent-text" size={16} />
                <h4 className="text-xs font-bold theme-text uppercase tracking-wider">
                  {drawerSocialModal === "followers" ? `Followers (${drawerFollowers.length})` : `Following (${drawerFollowing.length})`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDrawerSocialModal(null)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2 pt-1">
              {(drawerSocialModal === "followers" ? drawerFollowers : drawerFollowing).map((u) => {
                const itemUser = typeof u === "object" ? u : { _id: u, fullName: "User", username: "user" };
                return (
                  <div
                    key={itemUser._id}
                    onClick={() => handleInspectUserProfile(itemUser)}
                    className="p-2.5 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-2 cursor-pointer hover:theme-accent-tint transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={itemUser.avatar} alt={itemUser.fullName} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold theme-text truncate">{itemUser.fullName}</span>
                        <span className="text-[10px] theme-accent-text font-mono truncate">@{itemUser.username}</span>
                      </div>
                    </div>
                    <span className="text-[10px] theme-accent-text font-bold uppercase tracking-wider">View Profile</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Instagram-Style User Profile Inspector Popup Modal */}
      {inspectedProfileUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setInspectedProfileUser(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-3 animate-bubbleIn relative max-h-[85vh] overflow-y-auto scrollbar-thin"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setInspectedProfileUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
            >
              <FiX size={18} />
            </button>

            <Avatar src={inspectedProfileUser.avatar} alt={inspectedProfileUser.fullName} size="xl" />

            <div className="flex flex-col items-center">
              <h3 className="text-sm font-bold theme-text flex items-center gap-1.5">
                {inspectedProfileUser.fullName}
                {inspectedProfileUser.isVIP && (
                  <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-black">
                    PRO
                  </span>
                )}
                {inspectedProfileUser.isPrivateAccount && (
                  <FiLock size={12} className="text-amber-400" title="Private Account" />
                )}
              </h3>
              <span className="text-xs theme-accent-text font-mono">@{inspectedProfileUser.username}</span>
            </div>

            {inspectedProfileUser.bio && (
              <p className="text-xs theme-text-muted italic px-2">"{inspectedProfileUser.bio}"</p>
            )}

            <div className="grid grid-cols-2 gap-4 w-full p-2.5 rounded-2xl theme-soft-bg border theme-border text-center">
              <div className="flex flex-col">
                <span className="text-xs font-bold theme-text">{inspectedProfileUser.followers?.length || 0}</span>
                <span className="text-[10px] theme-text-muted">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold theme-text">{inspectedProfileUser.following?.length || 0}</span>
                <span className="text-[10px] theme-text-muted">Following</span>
              </div>
            </div>

            {inspectedProfileUser.isPrivateAccount ? (
              <div className="w-full py-8 px-4 rounded-2xl theme-soft-bg border theme-border flex flex-col items-center gap-2 text-center">
                <FiLock size={24} className="text-amber-400 mb-1" />
                <h4 className="text-xs font-bold theme-text">This Account is Private</h4>
                <p className="text-[10px] theme-text-muted">
                  Follow this account to see their photos and videos.
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <span className="text-[10px] font-bold theme-text-muted uppercase tracking-wider text-left px-1 flex items-center gap-1">
                  <FiGrid size={12} /> Posts ({inspectedUserPosts.length})
                </span>
                {inspectedUserPosts.length === 0 ? (
                  <p className="text-xs theme-text-muted py-6 text-center">No posts shared yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    {inspectedUserPosts.map((post, idx) => (
                      <div
                        key={post._id || idx}
                        className="aspect-square rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                        onClick={() => window.open(post.mediaUrl || post.url, "_blank")}
                      >
                        <img src={post.mediaUrl || post.url} alt="User Post" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => {
                if (startChatWithUser && inspectedProfileUser._id) {
                  startChatWithUser(inspectedProfileUser._id);
                  setInspectedProfileUser(null);
                  onClose();
                }
              }}
              className="w-full py-2.5 theme-accent-bg text-white font-bold text-xs flex items-center justify-center gap-1.5 mt-2 shadow"
            >
              <FiMessageSquare size={14} /> Message
            </Button>
          </div>
        </div>
      )}

      {/* Chat Wallpaper Modal */}
      <ChatWallpaperModal
        isOpen={showWallpaperModal}
        onClose={() => setShowWallpaperModal(false)}
        chatId={activeChat._id}
      />

      {/* Multi-Duration Mute Modal */}
      {showMuteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowMuteModal(false)}
        >
          <div
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl animate-bubbleIn flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h4 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiBellOff className="text-orange-500" /> Mute Notifications
              </h4>
              <button onClick={() => setShowMuteModal(false)} className="theme-text-muted">
                <FiX size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {MUTE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedMuteOption(opt.id)}
                  className={`p-3 rounded-2xl border text-xs text-left flex items-center justify-between transition ${
                    selectedMuteOption === opt.id
                      ? "theme-accent-border theme-accent-tint"
                      : "theme-border theme-soft-bg/50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold theme-text">{opt.label}</span>
                    <span className="text-[10px] theme-text-muted">{opt.desc}</span>
                  </div>
                  {selectedMuteOption === opt.id && <FiCheck className="theme-accent-text shrink-0" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t theme-border">
              <button
                type="button"
                onClick={() => setShowMuteModal(false)}
                className="flex-1 py-2.5 rounded-xl theme-soft-bg text-xs font-semibold theme-text-muted hover:theme-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApplyMute(selectedMuteOption)}
                className="flex-1 py-2.5 rounded-xl theme-accent-bg text-white text-xs font-semibold shadow-lg"
              >
                Mute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disappearing Messages Modal */}
      {showDisappearModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowDisappearModal(false)}
        >
          <div
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl animate-bubbleIn flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h4 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiClock className="theme-accent-text" /> Message Timer
              </h4>
              <button onClick={() => setShowDisappearModal(false)} className="theme-text-muted">
                <FiX size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {[
                { id: "off", label: "Off" },
                { id: "after_view", label: "Auto-delete after view" },
                { id: "24h", label: "24 Hours" },
                { id: "7d", label: "7 Days" },
                { id: "90d", label: "90 Days" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={async () => {
                    try {
                      await chatService.setDisappearingTimer(activeChat._id, opt.id);
                      setDisappearingTime(opt.id);
                      toast.success(`Timer set: ${opt.label}`);
                      setShowDisappearModal(false);
                      if (refreshChats) refreshChats();
                    } catch {
                      toast.error("Failed to update timer");
                    }
                  }}
                  className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition ${
                    disappearingTime === opt.id
                      ? "theme-accent-border theme-accent-tint"
                      : "theme-border theme-soft-bg/50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {disappearingTime === opt.id && <FiCheck className="theme-accent-text" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Set Vault Code Modal */}
      {showSetCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setShowSetCodeModal(false)}
        >
          <form
            onSubmit={handleSaveVaultCode}
            className="w-full max-w-sm theme-panel-bg border border-amber-400/40 rounded-3xl p-6 shadow-2xl animate-bubbleIn flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h4 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiKey className="text-amber-400" /> Set Secret Vault Code
              </h4>
              <button type="button" onClick={() => setShowSetCodeModal(false)} className="theme-text-muted">
                <FiX size={18} />
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-lg font-bold text-amber-400">$</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 4-6 digits (e.g. 1234)"
                value={newVaultCode}
                onChange={(e) => setNewVaultCode(e.target.value.replace(/\D/g, ""))}
                className="w-full theme-soft-bg border theme-border rounded-xl pl-8 pr-4 py-2.5 font-mono text-lg tracking-widest theme-text outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || newVaultCode.length < 4}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs shadow-lg transition"
            >
              Save & Archive Chat
            </button>
          </form>
        </div>
      )}

      {/* Chat Lock Prompt Modal */}
      {showLockPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowLockPrompt(false)}
        >
          <form
            onSubmit={handleConfirmChatLock}
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl animate-bubbleIn flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b theme-border pb-3">
              <h4 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiLock className="text-emerald-500" /> {isLocked ? "Unlock Chat" : "Lock Secret Chat"}
              </h4>
              <button type="button" onClick={() => setShowLockPrompt(false)} className="theme-text-muted">
                <FiX size={16} />
              </button>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN..."
              value={lockPinInput}
              onChange={(e) => setLockPinInput(e.target.value.replace(/\D/g, ""))}
              className="w-full theme-soft-bg border theme-border rounded-xl px-3.5 py-2.5 text-center tracking-widest text-lg font-mono theme-text outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={lockPinInput.length < 4}
              className="w-full py-2.5 rounded-xl theme-accent-bg text-white text-xs font-semibold shadow-lg"
            >
              Confirm
            </button>
          </form>
        </div>
      )}

      {/* Share Profile Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl animate-bubbleIn flex flex-col items-center text-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar src={currentAvatarSrc} alt={currentDisplayName} size="lg" />
            <div>
              <h4 className="text-sm font-bold theme-text">{currentDisplayName}</h4>
              <p className="text-xs theme-text-muted">@{otherUser?.username || "kafchat"}</p>
            </div>

            <button
              onClick={handleShareProfile}
              className="w-full py-2.5 rounded-xl theme-accent-bg text-white text-xs font-semibold shadow-lg flex items-center justify-center gap-2 transition mt-2"
            >
              <FiShare2 size={14} /> Share Contact Card
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen DP Preview */}
      {showFullDp && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-fadeIn p-4"
          onClick={() => setShowFullDp(false)}
        >
          <div
            className="absolute top-0 inset-x-0 h-16 px-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wide">
                {currentDisplayName}
              </span>
              <span className="text-[11px] text-gray-300">Profile Photo</span>
            </div>

            <div className="flex items-center gap-3">
              {currentAvatarSrc && (
                <a
                  href={currentAvatarSrc}
                  download={`${currentDisplayName || "profile"}-dp.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Download"
                >
                  <FiDownload size={18} />
                </a>
              )}
              <button
                onClick={() => setShowFullDp(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Close"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          <div
            className="relative max-w-lg w-full max-h-[80vh] flex items-center justify-center animate-bubbleIn p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {currentAvatarSrc ? (
              <img
                src={currentAvatarSrc}
                alt={currentDisplayName}
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/20"
              />
            ) : (
              <div className="w-48 h-48 rounded-full theme-accent-bg text-white text-6xl font-bold flex items-center justify-center shadow-2xl border-4 border-white/20">
                {(currentDisplayName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInfoDrawer;