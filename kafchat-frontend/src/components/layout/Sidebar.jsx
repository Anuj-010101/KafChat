import { useState, useMemo, useEffect, useRef } from "react";
import {
  FiPlus,
  FiSearch,
  FiFilm,
  FiCamera,
  FiMessageSquare,
  FiUserPlus,
  FiLock,
  FiUnlock,
  FiCloud,
  FiMic,
  FiX,
  FiHeart,
  FiUsers,
  FiChevronUp,
  FiCheck,
  FiSettings,
  FiStar,
  FiUserCheck,
  FiClock,
  FiShield,
  FiUser,
  FiMail,
  FiPhone,
  FiKey,
  FiTrash2,
  FiVolumeX,
  FiSlash,
  FiArchive,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import StatusBar from "../status/StatusBar";
import ReelsFeedModal from "../social/ReelsFeedModal";
import CameraStudioModal from "../camera/CameraStudioModal";
import ProfileModal from "../profile/ProfileModal";
import VipProModal from "../profile/VipProModal";
import ActivityFeed from "../social/ActivityFeed";
import CreateGroupModal from "../chat/CreateGroupModal";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import toast from "react-hot-toast";

const Sidebar = ({ mobileVisible }) => {
  const { user, login, register } = useAuth();
  const {
    chats = [],
    activeChat,
    openChat,
    startChatWithUser,
    loadingChats,
    toggleLock,
    fetchChats,
  } = useChat();

  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbSearchResults, setDbSearchResults] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [followActionState, setFollowActionState] = useState({});

  const [contextMenuChat, setContextMenuChat] = useState(null);
  const [contextMenuCoords, setContextMenuCoords] = useState({ x: 0, y: 0 });

  const [suggestions, setSuggestions] = useState([]);

  const currentUserId = (user?._id || user?.id)?.toString();
  const storageKey = `kafchat_opened_connect_${currentUserId || "guest"}`;
  const [hasOpenedConnect, setHasOpenedConnect] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });

  const [showReelsModal, setShowReelsModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  const [hasUnreadActivity, setHasUnreadActivity] = useState(false);
  const [activeBottomNav, setActiveBottomNav] = useState("chats");

  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  const accountSwitcherRef = useRef(null);
  const contextMenuRef = useRef(null);

  const [unlockChatId, setUnlockChatId] = useState(null);
  const [pinInput, setPinInput] = useState("");

  const isVip = Boolean(user?.isVIP);
  const userPin = (user?.lockPin || "").toString().replace(/^\$/, "").trim();

  const isSecretVaultUnlocked = Boolean(
    searchQuery.trim().startsWith("$") &&
      userPin &&
      searchQuery.trim().replace(/^\$/, "") === userPin
  );

  useEffect(() => {
    const fetchSuggestionsAndContacts = async () => {
      try {
        const { data } = await api.get("/users/suggestions");
        if (data?.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions.filter(u => u._id !== currentUserId));
          return;
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }

      try {
        const { data } = await api.get("/users/search?q=");
        if (data?.users && data.users.length > 0) {
          setSuggestions(data.users.filter(u => u._id !== currentUserId));
          return;
        }
      } catch {}

      try {
        const { data } = await api.get("/users");
        const list = Array.isArray(data) ? data : data?.users || [];
        if (list.length > 0) {
          setSuggestions(list.filter(u => (u._id || u.id)?.toString() !== currentUserId));
        }
      } catch {}
    };
    fetchSuggestionsAndContacts();
  }, [currentUserId]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (accountSwitcherRef.current && !accountSwitcherRef.current.contains(e.target)) {
        setShowAccountSwitcher(false);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenuChat(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuCoords({ x: e.clientX || 150, y: e.clientY || 200 });
    setContextMenuChat(chat);
  };

  const handleMenuAction = async (actionType, chat) => {
    setContextMenuChat(null);
    if (!chat) return;

    try {
      if (actionType === "pin") {
        const { data } = await api.patch(`/chats/${chat._id}/pin`);
        toast.success(data.message || "Pin status updated!");
        if (fetchChats) fetchChats();
      } else if (actionType === "favorite") {
        const { data } = await api.patch(`/chats/${chat._id}/favorite`);
        toast.success(data.message || "Favorite status updated!");
        if (fetchChats) fetchChats();
      } else if (actionType === "mute") {
        toast.success("Chat notifications muted 🔕");
      } else if (actionType === "delete") {
        if (window.confirm("Are you sure you want to delete this chat conversation?")) {
          await api.delete(`/chats/${chat._id}`).catch(() => {});
          toast.success("Chat deleted successfully");
          if (fetchChats) fetchChats();
        }
      } else if (actionType === "block") {
        const other = chat.participants?.find((p) => (p?._id || p)?.toString() !== currentUserId);
        if (other?._id) {
          await api.post(`/users/block/${other._id}`).catch(() => {});
          toast.success("User blocked successfully 🚫");
          if (fetchChats) fetchChats();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to perform action");
    }
  };

  useEffect(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery || rawQuery.startsWith("$")) {
      setDbSearchResults([]);
      setIsSearchingDb(false);
      return;
    }

    const cleanQuery = rawQuery.replace(/^@+/, "");
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        if (isMounted) setIsSearchingDb(true);
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(cleanQuery)}`);
        if (isMounted) {
          const results = Array.isArray(data?.users) ? data.users : [];
          setDbSearchResults(
            results.filter((u) => (u?._id || u?.id)?.toString() !== currentUserId)
          );
        }
      } catch {
        if (isMounted) {
          try {
            const fallbackRes = await api.get(`/users?search=${encodeURIComponent(cleanQuery)}`);
            const fallbackResults = Array.isArray(fallbackRes.data?.users) ? fallbackRes.data.users : [];
            setDbSearchResults(
              fallbackResults.filter((u) => (u?._id || u?.id)?.toString() !== currentUserId)
            );
          } catch {
            setDbSearchResults([]);
          }
        }
      } finally {
        if (isMounted) setIsSearchingDb(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUserId]);

  const handleOpenConnectModal = () => {
    setShowConnectModal(true);
    setHasOpenedConnect(true);
    localStorage.setItem(storageKey, "true");
  };

  const handleStartChatWithSearchedUser = async (targetUser) => {
    const targetId = targetUser?._id || targetUser?.id;
    if (!targetId) return;

    try {
      const existing = chats.find(
        (c) =>
          !c.isGroupChat &&
          c.participants?.some((p) => (p?._id || p)?.toString() === targetId.toString())
      );

      if (existing) {
        openChat(existing);
        setShowConnectModal(false);
        setSearchQuery("");
        return;
      }

      if (startChatWithUser) {
        await startChatWithUser(targetId);
        setShowConnectModal(false);
        setSearchQuery("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open chat");
    }
  };

  const fetchLinkedAccounts = async () => {
    try {
      const { data } = await api.get("/auth/linked-accounts");
      if (data?.success) setLinkedAccounts(data.accounts || []);
    } catch {
      setLinkedAccounts([]);
    }
  };

  const handleSwitchAccount = async (targetUserId) => {
    if (targetUserId === currentUserId) {
      setShowAccountSwitcher(false);
      return;
    }
    try {
      setSwitchingAccount(true);
      const { data } = await api.post("/auth/switch-account", { targetUserId });
      if (data?.success && data?.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("kafchat_token", data.token);
        if (login) login(data.user, data.token);
        toast.success(`Switched to @${data.user?.username || "profile"}`);
        setShowAccountSwitcher(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to switch profile");
    } finally {
      setSwitchingAccount(false);
    }
  };

  const filteredChats = useMemo(() => {
    const rawQuery = searchQuery.trim();

    const processed = (chats || [])
      .filter((c) => c && !c.isSelfChat)
      .filter((c) => {
        if (isSecretVaultUnlocked) {
          return c.isLocked || c.isArchived;
        }

        if (rawQuery.length > 0 && !rawQuery.startsWith("$")) {
          const cleanQ = rawQuery.replace(/^@+/, "").toLowerCase();
          const other = c.participants?.find(
            (p) => (p?._id || p)?.toString() !== currentUserId
          );
          const name = c.isGroupChat
            ? c.chatName || ""
            : other?.fullName || other?.username || "";
          const handle = other?.username || "";
          return name.toLowerCase().includes(cleanQ) || handle.toLowerCase().includes(cleanQ);
        }

        if (c.isLocked || c.isArchived) return false;

        if (filterTab === "unread") return Number(c.unreadCount) > 0;
        
        if (filterTab === "favorites") {
          const isFav =
            c.isFavorite ||
            c.favoriteBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
          return isFav;
        }

        if (filterTab === "personal") return !c.isGroupChat && !c.isSavedCloud;
        if (filterTab === "groups") return c.isGroupChat;
        return true;
      });

    return processed.sort((a, b) => {
      const isAPinned =
        a.isPinned ||
        a.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
      const isBPinned =
        b.isPinned ||
        b.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);

      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;

      const timeA = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  }, [chats, filterTab, searchQuery, currentUserId, isSecretVaultUnlocked]);

  const totalUnread = useMemo(() => {
    return (chats || [])
      .filter((c) => c && !c.isSelfChat && !c.isLocked && !c.isArchived)
      .reduce((acc, c) => acc + (Number(c?.unreadCount) || 0), 0);
  }, [chats]);

  const handleOpenTopActivity = () => {
    setShowActivityModal(true);
    setHasUnreadActivity(false);
    localStorage.setItem(`last_viewed_activity_${user?._id}`, Date.now().toString());
  };

  const handleChatClick = (chat) => {
    if (chat.isLocked && !isSecretVaultUnlocked) {
      setUnlockChatId(chat._id);
      setPinInput("");
      return;
    }
    openChat(chat);
  };

  const isNormalSearchActive = searchQuery.trim().length > 0 && !searchQuery.startsWith("$");

  const displayedSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return suggestions;
    const q = searchQuery.toLowerCase().replace(/^@+/, "");
    return suggestions.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.username?.toLowerCase().includes(q)
    );
  }, [suggestions, searchQuery]);

  return (
    <>
      <aside
        className={`w-full sm:w-[390px] lg:w-[420px] shrink-0 theme-panel-bg border-r theme-border flex flex-col h-[100dvh] sm:h-full select-none justify-between overflow-hidden relative ${
          mobileVisible ? "flex" : "hidden sm:flex"
        }`}
      >
        <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col pb-28">
          {/* Top Header */}
          <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              KafChat
            </h1>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setShowVipModal(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                  isVip
                    ? "bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 text-amber-400 shadow-sm"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                }`}
              >
                <span>{isVip ? "👑 VIP PRO" : "⚡ Go PRO"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenTopActivity}
                className="relative p-2 rounded-full theme-soft-bg text-pink-500 border border-pink-500/20 hover:bg-pink-500/10 transition cursor-pointer"
                title="Activity & Follow Requests"
              >
                <FiHeart size={16} className="fill-pink-500/20" />
                {hasUnreadActivity && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 theme-panel-bg animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-full theme-soft-bg theme-text-muted hover:theme-text border theme-border transition cursor-pointer"
                title="Settings & Profile"
              >
                <FiSettings size={16} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 sm:px-5 py-2 shrink-0">
            <div
              className={`w-full h-11 rounded-2xl theme-soft-bg border px-4 flex items-center gap-2.5 transition ${
                isSecretVaultUnlocked
                  ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-500/5"
                  : "theme-border focus-within:theme-accent-border"
              }`}
            >
              {isSecretVaultUnlocked ? (
                <FiShield className="text-amber-400 shrink-0 animate-pulse" size={16} />
              ) : (
                <FiSearch className="theme-text-muted shrink-0" size={16} />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={userPin ? "Search name, @user or $code..." : "Search people by name, @username..."}
                className="w-full bg-transparent text-xs theme-text placeholder:theme-text-muted outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDbSearchResults([]);
                  }}
                  className="text-gray-400 hover:theme-text p-1"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Stories Tray */}
          {!isNormalSearchActive && !isSecretVaultUnlocked && (
            <div className="px-3 sm:px-4 py-1 shrink-0">
              <StatusBar />
            </div>
          )}

          {/* Filter Tabs */}
          {!isNormalSearchActive && !isSecretVaultUnlocked && (
            <div className="px-4 sm:px-5 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread", count: totalUnread },
                { id: "favorites", label: "Favorites" },
                { id: "personal", label: "Direct" },
                { id: "groups", label: "Groups" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    filterTab === tab.id
                      ? "theme-accent-bg text-white shadow-sm"
                      : "bg-transparent theme-text-muted hover:theme-text border border-transparent"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.id === "unread" && tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 text-[9px] rounded-full font-black ${
                        filterTab === "unread"
                          ? "bg-white text-slate-950"
                          : "theme-accent-bg text-white"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* COMPACT CHAT LIST & GLOBAL USER SEARCH RESULTS */}
          {!isNormalSearchActive ? (
            <div className="px-3 sm:px-4 py-1 flex flex-col gap-1">
              {loadingChats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 rounded-full border-2 theme-accent-border border-t-transparent animate-spin" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="py-12 text-center theme-text-muted text-xs">
                  {isSecretVaultUnlocked
                    ? "No locked or archived chats in your Secret Vault."
                    : "No conversations found."}
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const other = chat.participants?.find(
                    (p) => (p?._id || p)?.toString() !== currentUserId
                  );
                  const isSaved = Boolean(chat.isSavedCloud);
                  const isGroup = Boolean(chat.isGroupChat);
                  const isSelected = activeChat?._id === chat._id;
                  const unread = Number(chat.unreadCount) || 0;
                  const lastMsg = chat.lastMessage;
                  
                  const isPinned =
                    chat.isPinned ||
                    chat.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId);
                  
                  const isFavorite =
                    chat.isFavorite ||
                    chat.favoriteBy?.some((id) => (id?._id || id)?.toString() === currentUserId);

                  const isOtherOnline =
                    Boolean(other?.isOnline) && !Boolean(other?.isGhostModeActive);

                  return (
                    <div
                      key={chat._id}
                      onClick={() => handleChatClick(chat)}
                      onContextMenu={(e) => handleContextMenu(e, chat)}
                      className={`px-3 py-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? "theme-soft-bg theme-accent-border shadow-sm"
                          : "theme-panel-bg theme-border hover:theme-soft-bg"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {isSaved ? (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-base shadow-sm">
                              <FiCloud />
                            </div>
                          ) : (
                            <Avatar
                              src={isGroup ? chat.groupAvatar : other?.avatar}
                              alt={isGroup ? chat.chatName : other?.fullName}
                              size="md"
                            />
                          )}
                          {!isSaved && !isGroup && isOtherOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 theme-panel-bg" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold theme-text truncate">
                              {isSaved
                                ? "Saved Messages"
                                : isGroup
                                ? chat.chatName
                                : other?.fullName || "User"}
                            </span>
                            {other?.isVIP && (
                              <span className="px-1 py-0.1 rounded-full bg-amber-500 text-black text-[8px] font-black">
                                PRO
                              </span>
                            )}
                            {chat.isLocked && (
                              <FiLock size={10} className="text-amber-400" title="Locked Chat" />
                            )}
                            {chat.isArchived && (
                              <FiArchive size={10} className="text-cyan-400" title="Archived Chat" />
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[11px] theme-text-muted truncate mt-0.5">
                            {isSaved ? (
                              <span className="truncate">Personal Storage Vault</span>
                            ) : lastMsg?.deletedForEveryone ? (
                              <span className="italic theme-text-muted truncate">🚫 Message deleted</span>
                            ) : lastMsg?.voiceDurationSec ? (
                              <span className="theme-accent-text flex items-center gap-1 truncate font-medium">
                                <FiMic size={11} /> Voice Note ({lastMsg.voiceDurationSec}s)
                              </span>
                            ) : (
                              <span className="truncate">{lastMsg?.text || "Started conversation"}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] theme-text-muted font-mono">
                            {lastMsg?.createdAt
                              ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>

                          {isFavorite && (
                            <FiStar size={12} className="fill-amber-400 text-amber-400 shrink-0" title="Favorite" />
                          )}

                          {isPinned && (
                            <span className="text-sm shrink-0 select-none leading-none" title="Pinned Chat">
                              📌
                            </span>
                          )}
                        </div>

                        {unread > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full theme-accent-bg text-white text-[9px] font-black shadow-sm">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="px-4 sm:px-5 py-2 flex flex-col gap-4 animate-fadeIn">
              {/* Existing Matching Chats */}
              {filteredChats.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider px-1">
                    Existing Chats ({filteredChats.length})
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {filteredChats.map((chat) => {
                      const other = chat.participants?.find(
                        (p) => (p?._id || p)?.toString() !== currentUserId
                      );
                      const isGroup = Boolean(chat.isGroupChat);
                      const isCloud = Boolean(chat.isSavedCloud);
                      const isOtherOnline =
                        Boolean(other?.isOnline) && !Boolean(other?.isGhostModeActive);

                      return (
                        <div
                          key={chat._id}
                          onClick={() => handleChatClick(chat)}
                          className="p-3 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3 cursor-pointer hover:theme-accent-tint transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <Avatar
                                src={isGroup ? chat.groupAvatar : other?.avatar}
                                alt={isGroup ? chat.chatName : other?.fullName}
                                size="sm"
                              />
                              {!isGroup && !isCloud && isOtherOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 theme-panel-bg" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold theme-text truncate">
                                  {isCloud ? "Saved Messages" : isGroup ? chat.chatName : other?.fullName || "User"}
                                </span>
                              </div>
                              <span className="text-[10px] theme-text-muted truncate">
                                {chat.lastMessage?.text || "Open conversation"}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] theme-accent-text font-bold uppercase tracking-wider">
                            Open
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Global Database User Search Results */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider px-1">
                  Global Users ({dbSearchResults.length})
                </span>
                {isSearchingDb ? (
                  <div className="py-6 text-center">
                    <div className="w-5 h-5 mx-auto rounded-full border-2 theme-accent-border border-t-transparent animate-spin" />
                  </div>
                ) : dbSearchResults.length === 0 ? (
                  <div className="py-6 text-center text-xs theme-text-muted">
                    No global users found matching "@{searchQuery.replace(/^@+/, "")}".
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {dbSearchResults.map((userObj) => (
                      <div
                        key={userObj._id || userObj.id}
                        onClick={() => handleStartChatWithSearchedUser(userObj)}
                        className="p-3 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3 cursor-pointer hover:theme-accent-tint transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={userObj.avatar} alt={userObj.fullName} size="sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold theme-text truncate">{userObj.fullName}</span>
                            <span className="text-[10px] theme-text-muted font-mono truncate">@{userObj.username}</span>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl theme-accent-bg text-white text-[10px] font-bold transition shrink-0">
                          Chat
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {contextMenuChat && (
          <div
            ref={contextMenuRef}
            className="absolute z-50 w-56 p-1.5 rounded-2xl theme-panel-bg border theme-border shadow-2xl flex flex-col gap-1 animate-bubbleIn select-none"
            style={{
              top: Math.min(contextMenuCoords.y - 40, window.innerHeight - 300),
              left: Math.min(contextMenuCoords.x, window.innerWidth - 230),
            }}
          >
            <div className="px-3 py-1.5 border-b theme-border mb-1">
              <span className="text-[11px] font-bold theme-text truncate block">
                {contextMenuChat.isGroupChat
                  ? contextMenuChat.chatName
                  : contextMenuChat.isSavedCloud
                  ? "Saved Messages"
                  : contextMenuChat.participants?.find((p) => (p?._id || p)?.toString() !== currentUserId)?.fullName || "Chat Options"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleMenuAction("pin", contextMenuChat)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold theme-text hover:theme-soft-bg flex items-center gap-2.5 transition"
            >
              <span className="text-sm select-none">📌</span>
              <span>
                {contextMenuChat.isPinned || contextMenuChat.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId)
                  ? "Unpin Chat"
                  : "Pin Chat"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMenuAction("favorite", contextMenuChat)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold theme-text hover:theme-soft-bg flex items-center gap-2.5 transition"
            >
              <FiStar className="text-amber-400 fill-amber-400/20" size={14} />
              <span>
                {contextMenuChat.isFavorite || contextMenuChat.favoriteBy?.some((id) => (id?._id || id)?.toString() === currentUserId)
                  ? "Remove from Favorites"
                  : "Add to Favorites"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMenuAction("mute", contextMenuChat)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold theme-text hover:theme-soft-bg flex items-center gap-2.5 transition"
            >
              <FiVolumeX className="text-indigo-400" size={14} />
              <span>Mute Notifications</span>
            </button>

            {!contextMenuChat.isSavedCloud && !contextMenuChat.isGroupChat && (
              <button
                type="button"
                onClick={() => handleMenuAction("block", contextMenuChat)}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition"
              >
                <FiSlash size={14} />
                <span>Block User</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleMenuAction("delete", contextMenuChat)}
              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-500 hover:bg-red-500/15 flex items-center gap-2.5 transition border-t theme-border mt-1 pt-1.5"
            >
              <FiTrash2 size={14} />
              <span>Delete Chat</span>
            </button>
          </div>
        )}

        {/* Floating Island Dock */}
        <div className="absolute bottom-2 inset-x-0 px-3 sm:px-4 pointer-events-none z-40">
          <div className="w-full h-15 rounded-[26px] theme-panel-bg/85 backdrop-blur-xl border theme-border px-2 grid grid-cols-5 items-center shadow-[0_8px_30px_rgb(0,0,0,0.18)] pointer-events-auto transition-all">
            <button
              type="button"
              onClick={() => setActiveBottomNav("chats")}
              className={`flex flex-col items-center justify-center gap-1 transition ${
                activeBottomNav === "chats"
                  ? "theme-accent-text font-bold"
                  : "theme-text-muted hover:theme-text"
              }`}
            >
              <FiMessageSquare size={19} />
              <span className="text-[10px] leading-tight">Chats</span>
            </button>

            <button
              type="button"
              onClick={() => setShowReelsModal(true)}
              className="flex flex-col items-center justify-center gap-1 theme-text-muted hover:text-pink-500 transition"
            >
              <FiFilm size={19} />
              <span className="text-[10px] leading-tight">Reels</span>
            </button>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                className="w-11 h-11 rounded-full theme-accent-bg text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                title="Camera Studio"
              >
                <FiCamera size={20} />
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={handleOpenConnectModal}
                className="flex flex-col items-center justify-center gap-1 transition relative theme-text-muted hover:theme-accent-text"
              >
                <div className="relative">
                  <FiPlus size={20} />
                  {!hasOpenedConnect && suggestions.length > 0 && (
                    <span className="absolute -top-1.5 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-bounce">
                      {suggestions.length > 9 ? "9+" : suggestions.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight">Connect</span>
              </button>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="flex flex-col items-center justify-center gap-0.5 theme-text-muted hover:theme-accent-text transition group"
              >
                <div className="relative w-6 h-6 rounded-full overflow-hidden border border-current flex items-center justify-center shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] font-bold">
                      {user?.fullName?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-semibold truncate max-w-[50px]">
                  @{user?.username?.slice(0, 7) || "Profile"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <ReelsFeedModal isOpen={showReelsModal} onClose={() => setShowReelsModal(false)} />
        <CameraStudioModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} />
        {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
        <VipProModal isOpen={showVipModal} onClose={() => setShowVipModal(false)} />
        <CreateGroupModal isOpen={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} />
      </aside>

      {/* Activity Modal */}
      {showActivityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowActivityModal(false)}
        >
          <div
            className="w-full max-w-md theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-3 max-h-[80vh] overflow-y-auto animate-bubbleIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b theme-border">
              <h3 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiHeart className="text-pink-500" /> Notifications & Requests
              </h3>
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>
            <ActivityFeed onClose={() => setShowActivityModal(false)} />
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b theme-border">
              <h3 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiUserPlus className="text-sky-400" /> Connect & Discover
              </h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 theme-soft-bg border theme-border rounded-xl text-xs">
              <FiSearch className="theme-text-muted shrink-0" size={14} />
              <input
                type="text"
                placeholder="Search people to connect..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent theme-text outline-none placeholder:theme-text-muted"
              />
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider">
                Suggested People ({displayedSuggestions.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowConnectModal(false);
                  setShowCreateGroupModal(true);
                }}
                className="text-xs font-bold theme-accent-text hover:underline flex items-center gap-1"
              >
                <FiUsers size={13} /> Create Group
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto scrollbar-thin">
              {displayedSuggestions.length === 0 ? (
                <div className="py-6 text-center text-xs theme-text-muted">
                  No suggestions found.
                </div>
              ) : (
                displayedSuggestions.map((sug) => (
                  <div
                    key={sug._id}
                    className="p-2.5 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-2 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={sug.avatar} alt={sug.fullName} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold theme-text truncate">{sug.fullName}</span>
                        <span className="text-[10px] theme-text-muted font-mono truncate">@{sug.username}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartChatWithSearchedUser(sug)}
                      className="px-3 py-1 rounded-xl theme-accent-bg text-white text-[10px] font-bold hover:opacity-90 transition shrink-0"
                    >
                      Follow
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;