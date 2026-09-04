import { useEffect, useRef, useState } from "react";
import {
  FiCheck,
  FiX,
  FiShield,
  FiClock,
  FiRefreshCw,
  FiBookmark,
  FiZap,
} from "react-icons/fi";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatInfoDrawer from "./ChatInfodrawer";
import StatusViewer from "../status/StatusViewer";
import CreateStatusModal from "../status/CreateStatusModal";
import Avatar from "../common/Avatar";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";
import { useCall } from "../../hooks/useCall";
import api from "../../services/api";
import toast from "react-hot-toast";

const ChatWindow = () => {
  const { user } = useAuth();
  const {
    activeChat,
    messages,
    sendMessage,
    typingUsers,
    emitTyping,
    emitStopTyping,
    replyingMessage,
    setReplyingMessage,
    loadingMessages,
    acceptRequest,
    rejectRequest,
  } = useChat();
  const { startCall } = useCall();

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = (user?._id || user?.id)?.toString();
  const isVip = Boolean(user?.isVIP);

  const [currentWallpaper, setCurrentWallpaper] = useState("");
  const [streakData, setStreakData] = useState(null);
  const [showStreakVaultModal, setShowStreakVaultModal] = useState(false);
  const [restoringStreak, setRestoringStreak] = useState(false);
  const [selectedStoryGroupForView, setSelectedStoryGroupForView] = useState(null);
  const [reshareDataForModal, setReshareDataForModal] = useState(null);

  const otherParticipant = activeChat?.participants?.find(
    (p) => (p?._id || p)?.toString() !== currentUserId
  );
  const otherUserId = (otherParticipant?._id || otherParticipant)?.toString();

  const fetchStreak = async () => {
    if (!activeChat || activeChat.isGroupChat || !otherUserId) return;
    try {
      const { data } = await api.get(`/streaks/${otherUserId}`);
      if (data?.success) {
        setStreakData(data.streak);
      }
    } catch {
      setStreakData(null);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, [activeChat?._id, otherUserId]);

  const handleRestoreStreak = async () => {
    if (!streakData?._id) return;
    try {
      setRestoringStreak(true);
      const { data } = await api.post(`/streaks/${streakData._id}/restore`);
      if (data?.success) {
        toast.success(data.message || "Streak Restored! 🔥");
        fetchStreak();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore streak");
    } finally {
      setRestoringStreak(false);
    }
  };

  useEffect(() => {
    if (activeChat?._id) {
      setCurrentWallpaper(localStorage.getItem(`chat_wallpaper_${activeChat._id}`) || "");
    }
  }, [activeChat?._id]);

  useEffect(() => {
    const handleWallpaperChange = (e) => {
      if (e.detail?.chatId === activeChat?._id) {
        setCurrentWallpaper(e.detail.wallpaper || "");
      }
    };
    window.addEventListener("wallpaper_updated", handleWallpaperChange);
    return () => window.removeEventListener("wallpaper_updated", handleWallpaperChange);
  }, [activeChat?._id]);

  // Click on story reaction/reply bubble to open active story directly
  useEffect(() => {
    const handleOpenStoryContext = async (e) => {
      const { storyId } = e.detail || {};
      if (!storyId) return;
      try {
        const { data } = await api.get("/status");
        const feeds = data?.feed || data?.statusGroups || [];
        for (const grp of feeds) {
          const found = grp.statuses?.find((s) => s._id === storyId);
          if (found) {
            setSelectedStoryGroupForView(grp);
            return;
          }
        }
        toast.error("This story has expired or no longer exists.");
      } catch {
        toast.error("Could not load story.");
      }
    };

    window.addEventListener("open_story_context", handleOpenStoryContext);
    return () => window.removeEventListener("open_story_context", handleOpenStoryContext);
  }, []);

  // Listen to reshare event triggered from story mention in chat (Dono events handle kar raha hai)
  useEffect(() => {
    const handleReshareTrigger = (e) => {
      const payload = e.detail?.storyContext || e.detail;
      if (payload) {
        setReshareDataForModal(payload);
      }
    };

    window.addEventListener("reshare_story_to_modal", handleReshareTrigger);
    window.addEventListener("open_create_story_reshare", handleReshareTrigger);

    return () => {
      window.removeEventListener("reshare_story_to_modal", handleReshareTrigger);
      window.removeEventListener("open_create_story_reshare", handleReshareTrigger);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  if (!activeChat) {
    return (
      <div className="flex-1 hidden sm:flex flex-col items-center justify-center theme-chat-bg p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-2xl mb-4 border border-sky-500/20">
          💬
        </div>
        <h3 className="text-base font-semibold theme-text">Select a conversation</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Choose a chat from the sidebar or connect with friends to start messaging.
        </p>
      </div>
    );
  }

  const wallpaperStyle = currentWallpaper
    ? currentWallpaper.startsWith("url(")
      ? { backgroundImage: currentWallpaper, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: currentWallpaper }
    : {};

  const isPending = activeChat.requestStatus === "pending";
  const requesterId = (activeChat.requestedBy?._id || activeChat.requestedBy)?.toString();
  const requestedByMe = requesterId === currentUserId;
  const isReceiver = isPending && !requestedByMe;

  const requesterProfile = activeChat.requestedBy?._id ? activeChat.requestedBy : otherParticipant;

  const streakCount = Number(streakData?.streakCount || 0);
  const isStreakBroken = streakData?.status === "BROKEN";
  const streakRecoveriesLeft = Number(user?.streakRecoveriesLeft || (isVip ? 5 : 3));

  return (
    <div className="flex-1 flex flex-col h-[100dvh] max-h-[100dvh] w-full min-w-0 theme-chat-bg relative select-none overflow-hidden">
      {/* Top Header: STICKY ON MOBILE - Kisi bhi scroll me gayab nahi hoga */}
      <div className="sticky top-0 z-30 w-full shrink-0 shadow-md">
        <ChatHeader onOpenInfo={() => setShowInfoDrawer(true)} onStartCall={startCall} />

        {/* Snap Streak Top Bar */}
        {!activeChat.isGroupChat && !activeChat.isSavedCloud && streakData && (
          <div className="px-4 py-1.5 bg-black/60 border-b theme-border backdrop-blur-md flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`p-1 rounded-lg flex items-center gap-1 text-xs font-black ${
                  isStreakBroken
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : streakCount >= 100
                    ? "bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 border border-amber-400/40 animate-pulse"
                    : streakCount >= 50
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                }`}
              >
                <span className="text-sm">{isStreakBroken ? "💔" : "🔥"}</span>
                <span>{streakCount} {isStreakBroken ? "Streak Broken" : "Day Streak"}</span>
              </div>

              {streakCount >= 50 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                  <FiZap size={10} /> {streakCount >= 100 ? "Elite Tier 2 Perks" : "Tier 1 Aesthetic Unlocked"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isStreakBroken ? (
                <button
                  type="button"
                  disabled={restoringStreak || streakRecoveriesLeft <= 0}
                  onClick={handleRestoreStreak}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black text-[11px] font-black flex items-center gap-1 shadow hover:opacity-90 disabled:opacity-50 transition"
                >
                  <FiRefreshCw className={restoringStreak ? "animate-spin" : ""} size={12} />
                  <span>Restore ({streakRecoveriesLeft} left)</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono theme-text-muted flex items-center gap-1">
                  <FiClock size={11} /> 24h Window
                </span>
              )}

              <button
                type="button"
                onClick={() => setShowStreakVaultModal(true)}
                className="p-1.5 rounded-xl theme-soft-bg theme-text-muted hover:theme-accent-text border theme-border transition"
                title="Saved Snaps Vault"
              >
                <FiBookmark size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message List: Sirf ye container scroll hoga */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin relative transition-all duration-300 min-h-0"
        style={wallpaperStyle}
      >
        {isReceiver && requesterProfile && (
          <div className="flex justify-center my-4 animate-fadeIn">
            <div className="w-full max-w-xs p-4 rounded-3xl theme-panel-bg border theme-border shadow-xl flex flex-col items-center text-center gap-2">
              <Avatar
                src={requesterProfile.avatar}
                alt={requesterProfile.fullName}
                size="lg"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold theme-text truncate">
                  {requesterProfile.fullName || "User"}
                </span>
                <span className="text-xs text-sky-400 font-mono font-semibold truncate">
                  @{requesterProfile.username || "username"}
                </span>
              </div>
              {requesterProfile.bio && (
                <p className="text-[11px] theme-text-muted italic px-2">
                  "{requesterProfile.bio}"
                </p>
              )}
              <span className="text-[10px] theme-text-muted mt-1 flex items-center gap-1">
                <FiShield size={11} className="text-amber-400" /> Message Request
              </span>
            </div>
          </div>
        )}

        <MessageList
          messages={messages}
          loading={loadingMessages}
          activeChat={activeChat}
          typingUsers={typingUsers}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bottom Dock */}
      {isPending ? (
        <div className="shrink-0 p-3 sm:p-4 theme-panel-bg border-t theme-border flex flex-col items-center gap-3 animate-fadeIn">
          {isReceiver ? (
            <div className="w-full max-w-md flex flex-col items-center gap-3 text-center">
              <p className="text-xs font-medium theme-text">
                Accept message request from{" "}
                <strong className="text-sky-400 font-mono">
                  @{requesterProfile?.username || "user"}
                </strong>
                ?
              </p>
              <div className="flex items-center gap-3 w-full justify-center">
                <button
                  type="button"
                  onClick={() => rejectRequest(activeChat._id)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition flex items-center gap-1.5"
                >
                  <FiX size={15} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => acceptRequest(activeChat._id)}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold theme-accent-bg text-white shadow-md hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <FiCheck size={15} /> Accept Request
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2.5 text-center">
              <p className="text-xs text-amber-400/90 font-medium flex items-center justify-center gap-1.5">
                ⏳ Request sent to{" "}
                <strong className="font-mono underline">
                  @{otherParticipant?.username || "user"}
                </strong>
                . Waiting for acceptance...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="shrink-0 p-2 sm:p-3 theme-panel-bg border-t theme-border w-full">
          <MessageInput />
        </div>
      )}

      {/* Drawer */}
      <ChatInfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        messages={messages}
        onStartCall={startCall}
      />

      {/* Story Viewer */}
      {selectedStoryGroupForView && (
        <StatusViewer
          group={selectedStoryGroupForView}
          onClose={() => setSelectedStoryGroupForView(null)}
        />
      )}

      {/* Direct Story Reshare Modal (Opens user's story studio with snapshot) */}
      {reshareDataForModal && (
        <CreateStatusModal
          initialReshareData={reshareDataForModal}
          onClose={() => setReshareDataForModal(null)}
        />
      )}

      {/* Dedicated Streak Vault Modal */}
      {showStreakVaultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setShowStreakVaultModal(false)}
        >
          <div
            className="w-full max-w-md theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-3 max-h-[75vh] animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b theme-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400">
                  <FiBookmark size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold theme-text">Dedicated Snap Streak Vault</h4>
                  <p className="text-[10px] theme-text-muted">Saved snaps from this streak</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStreakVaultModal(false)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {streakData?.savedSnapsVault?.length === 0 ? (
                <p className="text-center py-10 text-xs theme-text-muted">
                  No snaps saved in this streak vault yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {streakData?.savedSnapsVault?.map((snap, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border theme-border group cursor-pointer"
                      onClick={() => window.open(snap.mediaUrl, "_blank")}
                    >
                      {snap.mediaType === "video" ? (
                        <video src={snap.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={snap.mediaUrl} alt="Saved Snap" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-1 bg-black/60 text-[8px] text-white font-mono text-center truncate">
                        {new Date(snap.savedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;