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
  FiArchive,
  FiShield,
  FiUser,
  FiMail,
  FiPhone,
  FiKey,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import StatusBar from "../status/StatusBar";
import ReelsFeedModal from "../social/ReelsFeedModal";
import CameraStudioModal from "../camera/CameraStudioModal";
import ProfileModal from "../profile/ProfileModal";
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
  } = useChat();

  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dbSearchResults, setDbSearchResults] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [followActionState, setFollowActionState] = useState({});

  const [suggestions, setSuggestions] = useState([
    { _id: "sug_1", fullName: "Admin Pro", username: "adminpro", avatar: "" },
    { _id: "sug_2", fullName: "KafChat Support", username: "support", avatar: "" },
    { _id: "sug_3", fullName: "Developer Hub", username: "devhub", avatar: "" },
  ]);

  // Persistent tracking in localStorage so refresh doesn't bring back the badge
  const currentUserId = (user?._id || user?.id)?.toString();
  const storageKey = `kafchat_opened_connect_${currentUserId || "guest"}`;
  const [hasOpenedConnect, setHasOpenedConnect] = useState(() => {
    return localStorage.getItem(storageKey) === "true";
  });

  const [showReelsModal, setShowReelsModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // New Account Creation Modal States
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

  const [unlockChatId, setUnlockChatId] = useState(null);
  const [pinInput, setPinInput] = useState("");

  const isVip = Boolean(user?.isVIP);
  const userPin = (user?.lockPin || "").toString().replace(/^\$/, "").trim();

  const isSecretVaultUnlocked = Boolean(
    searchQuery.trim().startsWith("$") &&
      userPin &&
      searchQuery.trim().replace(/^\$/, "") === userPin
  );

  // Fetch live suggestions & contacts on mount
  useEffect(() => {
    const fetchSuggestionsAndContacts = async () => {
      try {
        const { data } = await api.get("/users/suggestions");
        if (data?.users && data.users.length > 0) {
          setSuggestions(data.users.filter(u => u._id !== currentUserId));
          return;
        }
      } catch {
        // Fallback
      }

      try {
        const { data } = await api.get("/users/search?q=");
        if (data?.users && data.users.length > 0) {
          setSuggestions(data.users.filter(u => u._id !== currentUserId));
          return;
        }
      } catch {
        // Fallback
      }

      try {
        const { data } = await api.get("/users");
        const list = Array.isArray(data) ? data : data?.users || [];
        if (list.length > 0) {
          setSuggestions(list.filter(u => (u._id || u.id)?.toString() !== currentUserId));
        }
      } catch {
        // Keep default fallback
      }
    };
    fetchSuggestionsAndContacts();
  }, [currentUserId]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (accountSwitcherRef.current && !accountSwitcherRef.current.contains(e.target)) {
        setShowAccountSwitcher(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

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

  // Submit Handler for New Account Creation from Sidebar
  const handleCreateNewAccountSubmit = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim()) {
      return toast.error("Full Name, Username, and Password are required");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    setCreatingAccount(true);
    try {
      const fallbackDicebear = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newUsername.toLowerCase().trim())}`;
      
      const res = await register({
        fullName: newFullName.trim(),
        username: newUsername.toLowerCase().trim(),
        phoneNumber: newPhone.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword,
        avatar: fallbackDicebear,
      });

      if (res?.success) {
        toast.success("New account created & switched successfully! 🎉");
        setShowCreateAccountModal(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create account. If using same phone number, email is mandatory.");
    } finally {
      setCreatingAccount(false);
    }
  };

  const filteredChats = useMemo(() => {
    const rawQuery = searchQuery.trim();

    return (chats || [])
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
          return (
            c.isPinned ||
            c.pinnedBy?.some((id) => (id?._id || id)?.toString() === currentUserId)
          );
        }
        if (filterTab === "personal") return !c.isGroupChat && !c.isSavedCloud;
        if (filterTab === "groups") return c.isGroupChat;
        return true;
      });
  }, [chats, filterTab, searchQuery, currentUserId, isSecretVaultUnlocked]);

  const totalUnread = useMemo(() => {
    return (chats || [])
      .filter((c) => c && !c.isSelfChat && !c.isLocked && !c.isArchived)
      .reduce((acc, c) => acc + (Number(c?.unreadCount) || 0), 0);
  }, [chats]);

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
        setSearchQuery("");
        setDbSearchResults([]);
        return;
      }

      if (startChatWithUser) {
        await startChatWithUser(targetId);
        setSearchQuery("");
        setDbSearchResults([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open chat");
    }
  };

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

  const handleUnlockSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput || pinInput.length < 4) {
      toast.error("Enter valid 4-6 digit PIN");
      return;
    }
    const clean = pinInput.replace(/\D/g, "");
    const success = await toggleLock(unlockChatId, clean);
    if (success) {
      const targetChat = chats.find((c) => c._id === unlockChatId);
      if (targetChat) openChat(targetChat);
      setUnlockChatId(null);
    }
  };

  const isNormalSearchActive = searchQuery.trim().length > 0 && !searchQuery.startsWith("$");

  return (
    <aside
      className={`w-full sm:w-[390px] lg:w-[420px] shrink-0 theme-panel-bg border-r theme-border flex flex-col h-full select-none justify-between overflow-hidden ${
        mobileVisible ? "flex" : "hidden sm:flex"
      }`}
    >
      <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
        {/* Top Header */}
        <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            KafChat
          </h1>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
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

        {/* Dynamic Search & Secret Vault Input Bar */}
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

        {/* Secret Vault Header Banner */}
        {isSecretVaultUnlocked && (
          <div className="mx-4 sm:mx-5 my-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400 text-black">
                <FiUnlock size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-amber-300">Secret Vault Unlocked</span>
                <span className="text-[10px] theme-text-muted">Unlocked with your ${userPin} code</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-black/40 text-amber-400 border border-amber-400/30"
            >
              Lock Vault
            </button>
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

        {/* 1. Normal Chat List OR Secret Vault List */}
        {!isNormalSearchActive ? (
          <div className="px-4 sm:px-5 py-2 flex flex-col gap-2.5 pb-4">
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

                const isOtherOnline =
                  Boolean(other?.isOnline) && !Boolean(other?.isGhostModeActive);

                return (
                  <div
                    key={chat._id}
                    onClick={() => handleChatClick(chat)}
                    className={`p-3.5 rounded-[22px] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "theme-soft-bg theme-accent-border shadow-md"
                        : "theme-panel-bg theme-border hover:theme-soft-bg"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {isSaved ? (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-xl shadow-md">
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
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 theme-panel-bg" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold theme-text truncate">
                            {isSaved
                              ? "Saved Messages"
                              : isGroup
                              ? chat.chatName
                              : other?.fullName || "User"}
                          </span>
                          {other?.isVIP && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black">
                              PRO
                            </span>
                          )}
                          {chat.isLocked && (
                            <FiLock size={11} className="text-amber-400" title="Locked Chat" />
                          )}
                          {chat.isArchived && (
                            <FiArchive size={11} className="text-cyan-400" title="Archived Chat" />
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs theme-text-muted truncate mt-0.5">
                          {isSaved ? (
                            <span className="text-[11px] truncate">
                              Personal Storage Vault
                            </span>
                          ) : lastMsg?.deletedForEveryone ? (
                            <span className="text-[11px] italic theme-text-muted truncate">
                              🚫 Message deleted
                            </span>
                          ) : lastMsg?.voiceDurationSec ? (
                            <span className="text-[11px] theme-accent-text flex items-center gap-1 truncate font-medium">
                              <FiMic size={12} /> Voice Note ({lastMsg.voiceDurationSec}s)
                            </span>
                          ) : (
                            <span className="text-[11px] truncate">
                              {lastMsg?.text || "Started conversation"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {isPinned ? (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                          <FiStar size={10} className="fill-amber-400 text-amber-400" /> Favorite
                        </span>
                      ) : (
                        <span className="text-[10px] theme-text-muted font-mono">
                          {lastMsg?.createdAt
                            ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      )}

                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full theme-accent-bg text-white text-[10px] font-black shadow-md">
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
          /* 2. Active Search Results (Conversations + Discover People - Never Blanks!) */
          <div className="px-4 sm:px-5 py-2 flex flex-col gap-4 pb-4 animate-fadeIn">
            {filteredChats.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider px-1">
                  Active Chats ({filteredChats.length})
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
                              {chat.isLocked && <FiLock size={11} className="text-amber-400" />}
                              {chat.isArchived && <FiArchive size={11} className="text-cyan-400" />}
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

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider px-1">
                {isSearchingDb ? "Searching users..." : `Discover People (${dbSearchResults.length})`}
              </span>

              {dbSearchResults.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {dbSearchResults.map((searchedUser) => {
                    const isPrivate = Boolean(searchedUser.isPrivateAccount);
                    const isFollowingMe = Array.isArray(searchedUser.followers) && searchedUser.followers.some(
                      (id) => (id?._id || id)?.toString() === currentUserId
                    );
                    const userStatus = followActionState[searchedUser._id] || (isFollowingMe ? "FOLLOWING" : "NONE");
                    const isUserOnline =
                      Boolean(searchedUser.isOnline) && !Boolean(searchedUser.isGhostModeActive);

                    return (
                      <div
                        key={searchedUser._id}
                        className="p-3 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3 transition"
                      >
                        <div
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          onClick={() => handleStartChatWithSearchedUser(searchedUser)}
                        >
                          <div className="relative shrink-0">
                            <Avatar src={searchedUser.avatar} alt={searchedUser.fullName} size="sm" />
                            {isUserOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 theme-panel-bg" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold theme-text truncate">
                                {searchedUser.fullName}
                              </span>
                              {searchedUser.isVIP && (
                                <span className="text-[8px] bg-amber-500 text-black px-1 rounded-full font-black">
                                  PRO
                                </span>
                              )}
                              {isPrivate && (
                                <span className="text-[10px] text-amber-400" title="Private Account">
                                  <FiLock size={11} />
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] theme-accent-text font-mono truncate">
                              @{searchedUser.username}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartChatWithSearchedUser(searchedUser)}
                            className="px-3.5 py-1.5 rounded-xl theme-accent-bg text-white text-xs font-bold shadow hover:opacity-90 transition flex items-center gap-1"
                          >
                            <FiMessageSquare size={12} /> Message
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !isSearchingDb && filteredChats.length === 0 ? (
                <div className="py-8 text-center text-xs theme-text-muted">
                  No users found matching "{searchQuery}".
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation Dock */}
      <div className="p-3 sm:p-4 theme-panel-bg/95 backdrop-blur-md border-t theme-border shrink-0 relative">
        {showAccountSwitcher && (
          <div
            ref={accountSwitcherRef}
            className="absolute bottom-20 right-3 sm:right-6 z-50 w-64 p-2 rounded-2xl theme-panel-bg border theme-border shadow-2xl flex flex-col gap-1.5 animate-bubbleIn select-none"
          >
            <div className="px-2.5 py-1.5 border-b theme-border flex items-center justify-between">
              <span className="text-xs font-bold theme-text flex items-center gap-1.5">
                <FiUsers size={14} className="theme-accent-text" /> Switch Profile
              </span>
              <span className="text-[10px] theme-text-muted font-mono">
                {linkedAccounts.length} Handles
              </span>
            </div>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-thin">
              {linkedAccounts.map((acc) => {
                const isCurrent = acc._id === currentUserId;
                return (
                  <button
                    key={acc._id}
                    type="button"
                    disabled={switchingAccount}
                    onClick={() => handleSwitchAccount(acc._id)}
                    className={`w-full p-2 rounded-xl flex items-center justify-between gap-2 text-left transition ${
                      isCurrent
                        ? "theme-soft-bg theme-accent-border border"
                        : "hover:theme-soft-bg"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar src={acc.avatar} alt={acc.fullName} size="xs" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold theme-text truncate flex items-center gap-1">
                          {acc.fullName}
                          {acc.isVIP && (
                            <span className="text-[8px] bg-amber-500 text-black px-1 rounded-full font-black">
                              PRO
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] theme-text-muted font-mono truncate">
                          @{acc.username}
                        </span>
                      </div>
                    </div>
                    {isCurrent && <FiCheck className="theme-accent-text shrink-0" size={14} />}
                  </button>
                );
              })}
            </div>

            <div className="border-t theme-border pt-1 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setShowAccountSwitcher(false);
                  setShowCreateAccountModal(true); // <--- Opens Create New Account Modal
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold theme-text hover:theme-soft-bg flex items-center gap-2 transition"
              >
                <FiPlus className="theme-accent-text" size={14} />
                <span>Create New Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAccountSwitcher(false);
                  setShowProfileModal(true);
                }}
                className="w-full p-2 rounded-xl text-left text-xs font-semibold theme-text hover:theme-soft-bg flex items-center gap-2 transition"
              >
                <FiSettings className="theme-accent-text" size={14} />
                <span>Account & Settings</span>
              </button>
            </div>
          </div>
        )}

        <div className="w-full h-15 rounded-[24px] theme-soft-bg border theme-border px-2 grid grid-cols-5 items-center shadow-2xl">
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

          {/* Connect Button with Persistent Snapchat-style Red Counter Badge */}
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
              onClick={() => {
                fetchLinkedAccounts();
                setShowAccountSwitcher((prev) => !prev);
              }}
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
                <div className="absolute bottom-0 right-0 bg-black/60 rounded-full p-0.5">
                  <FiChevronUp size={8} />
                </div>
              </div>
              <span className="text-[9px] font-semibold truncate max-w-[50px]">
                @{user?.username?.slice(0, 7) || "Profile"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* CREATE NEW ACCOUNT MODAL */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <form
            onSubmit={handleCreateNewAccountSubmit}
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-6 shadow-2xl flex flex-col gap-3.5 animate-bubbleIn"
          >
            <div className="flex items-center justify-between pb-2 border-b theme-border">
              <h4 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiUser className="theme-accent-text" /> Create New Account
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="theme-text-muted hover:theme-text"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-[11px] theme-text-muted leading-relaxed">
              Add a new account. <span className="text-amber-400 font-semibold">Note:</span> If you are linking this to an existing mobile number, providing a Email ID is mandatory.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold theme-text">Full Name *</label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold theme-text">Username *</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                placeholder="Choose @username"
                className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold theme-text">Mobile No.</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(-10))}
                  placeholder="10-digit mobile"
                  className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold theme-text">Email ID</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Required for multi-acc"
                  className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold theme-text">Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creatingAccount}
              className="w-full py-2.5 rounded-xl theme-accent-bg text-white font-bold text-xs shadow-lg mt-1"
            >
              {creatingAccount ? "Creating..." : "Create Account & Login 🎉"}
            </button>
          </form>
        </div>
      )}

      {/* Unlock Single Chat PIN Modal */}
      {unlockChatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <form
            onSubmit={handleUnlockSubmit}
            className="w-full max-w-xs theme-panel-bg border theme-border rounded-3xl p-6 flex flex-col gap-4 shadow-2xl animate-bubbleIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold theme-text flex items-center gap-2">
                <FiLock className="theme-accent-text" /> Unlock Secret Chat
              </span>
              <button
                type="button"
                onClick={() => setUnlockChatId(null)}
                className="theme-text-muted hover:theme-text"
              >
                <FiX size={18} />
              </button>
            </div>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter your PIN"
              className="w-full theme-soft-bg border theme-border rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest theme-accent-text outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl theme-accent-bg text-white font-bold text-xs"
            >
              Unlock
            </button>
          </form>
        </div>
      )}

      {/* Activity Drawer */}
      {showActivityModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn select-none"
          onClick={() => setShowActivityModal(false)}
        >
          <div
            className="w-full sm:max-w-md theme-panel-bg border-t sm:border theme-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col max-h-[85vh] animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-pink-500/15 text-pink-500">
                  <FiHeart size={16} className="fill-pink-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold theme-text">Activity & Interactions</h3>
                  <span className="text-[10px] theme-text-muted">Follow requests & alerts</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin pt-2">
              <ActivityFeed onClose={() => setShowActivityModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Connect Friends Modal with Live Search, Preloaded Suggestions & Group Creation Option */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn select-none"
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="w-full sm:max-w-md theme-panel-bg border-t sm:border theme-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col max-h-[85vh] animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl theme-accent-tint">
                  <FiUsers size={16} />
                </div>
                <h3 className="text-sm font-bold theme-text">Find & Add Friends</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="pt-3 pb-1">
              <div className="w-full h-10 rounded-xl theme-soft-bg border theme-border px-3 flex items-center gap-2">
                <FiSearch className="theme-text-muted shrink-0" size={14} />
                <input
                  type="text"
                  placeholder="Search by name or @username..."
                  onChange={async (e) => {
                    const query = e.target.value.trim();
                    if (!query) {
                      try {
                        const { data } = await api.get("/users/suggestions");
                        if (data?.users && data.users.length > 0) {
                          setSuggestions(data.users.filter(u => u._id !== currentUserId));
                        }
                      } catch {
                        // Keep current suggestions
                      }
                      return;
                    }
                    try {
                      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
                      setSuggestions(Array.isArray(data?.users) ? data.users.filter(u => u._id !== currentUserId) : []);
                    } catch {
                      setSuggestions([]);
                    }
                  }}
                  className="w-full bg-transparent text-xs theme-text placeholder:theme-text-muted outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2.5 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider">
                  Suggestions & Contacts ({suggestions.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowConnectModal(false);
                    setShowCreateGroupModal(true);
                  }}
                  className="text-[11px] font-bold theme-accent-text hover:underline flex items-center gap-1"
                >
                  <FiUsers size={12} /> Create Group
                </button>
              </div>

              {suggestions.length === 0 ? (
                <p className="text-center py-8 text-xs theme-text-muted">
                  No users available or found.
                </p>
              ) : (
                suggestions.map((sug) => (
                  <div
                    key={sug._id || sug.id}
                    className="p-3 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3"
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      onClick={() => {
                        handleStartChatWithSearchedUser(sug);
                        setShowConnectModal(false);
                      }}
                    >
                      <Avatar src={sug.avatar} alt={sug.fullName} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold theme-text truncate">
                          {sug.fullName}
                        </span>
                        <span className="text-[10px] theme-accent-text font-mono truncate">
                          @{sug.username}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleStartChatWithSearchedUser(sug);
                        setShowConnectModal(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl theme-accent-bg text-white text-xs font-bold shadow hover:opacity-90 transition flex items-center gap-1"
                    >
                      <FiUserPlus size={12} /> Connect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ReelsFeedModal isOpen={showReelsModal} onClose={() => setShowReelsModal(false)} />
      <CameraStudioModal isOpen={showCameraModal} onClose={() => setShowCameraModal(false)} />
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
      
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </aside>
  );
};

export default Sidebar;