import { useEffect, useState } from "react";
import { FiCheck, FiX, FiHeart, FiUserCheck, FiMessageSquare } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { formatTimeAgo } from "../../utils/formatTime";
import api from "../../services/api";
import { useChat } from "../../hooks/useChat";
import toast from "react-hot-toast";

const ActivityFeed = ({ onClose }) => {
  const { startChatWithUser } = useChat();
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/social/activity");
      if (data) {
        setPendingRequests(data.pendingRequests || []);
        setNotifications(data.notifications || data.activities || []);
      }
    } catch {
      setPendingRequests([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleAcceptFollow = async (reqId, senderUsername) => {
    try {
      const { data } = await api.post(`/social/follow-request/${reqId}/accept`);
      if (data.success) {
        setPendingRequests((prev) => prev.filter((r) => r._id !== reqId));
        toast.success(`Accepted request from @${senderUsername || "user"}! 🎉`);
        fetchActivity();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleRejectFollow = async (reqId) => {
    try {
      const { data } = await api.post(`/social/follow-request/${reqId}/reject`);
      if (data.success) {
        setPendingRequests((prev) => prev.filter((r) => r._id !== reqId));
        toast.success("Request removed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleOpenSenderChat = async (senderId) => {
    try {
      if (startChatWithUser && senderId) {
        await startChatWithUser(senderId);
        if (onClose) onClose();
      }
    } catch {
      toast.error("Could not open chat");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 theme-accent-border border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasActivity = pendingRequests.length > 0 || notifications.length > 0;

  if (!hasActivity) {
    return (
      <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-xs theme-text-muted">
        <div className="w-10 h-10 rounded-full theme-soft-bg flex items-center justify-center text-pink-500">
          <FiHeart size={18} />
        </div>
        <p>No new activity or follow requests yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 select-none pb-3">
      {/* 1. Pending Follow Requests */}
      {pendingRequests.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider px-1">
            Follow Requests ({pendingRequests.length})
          </span>

          <div className="flex flex-col gap-1.5">
            {pendingRequests.map((req) => {
              const sender = req.sender || {};
              return (
                <div
                  key={req._id}
                  className="p-3 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={sender.avatar} alt={sender.fullName} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold theme-text truncate">
                        {sender.fullName || "User"}
                      </span>
                      <span className="text-[10px] theme-accent-text font-mono truncate">
                        @{sender.username || "username"}
                      </span>
                      <span className="text-[9px] theme-text-muted mt-0.5">
                        {formatTimeAgo(req.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRejectFollow(req._id)}
                      className="p-2 rounded-xl bg-red-500/15 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                      title="Reject"
                    >
                      <FiX size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcceptFollow(req._id, sender.username)}
                      className="px-3 py-1.5 rounded-xl theme-accent-bg text-white text-xs font-bold shadow hover:opacity-90 transition flex items-center gap-1 cursor-pointer"
                    >
                      <FiCheck size={13} /> Confirm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Notifications & Interacted Activities */}
      {notifications.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold theme-text-muted uppercase tracking-wider px-1">
            Recent Activity ({notifications.length})
          </span>

          <div className="flex flex-col gap-1.5">
            {notifications.map((notif) => {
              const sender = notif.sender || {};
              const isFollowAccept =
                notif.type === "REQUEST_ACCEPTED" ||
                notif.type === "FOLLOW_ACCEPT" ||
                notif.type === "follow_accept";

              return (
                <div
                  key={notif._id}
                  onClick={() => handleOpenSenderChat(sender._id)}
                  className="p-3 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3 cursor-pointer hover:theme-accent-tint transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={sender.avatar} alt={sender.fullName} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <p className="text-xs theme-text truncate">
                        <strong className="font-bold">{sender.fullName || "User"}</strong>{" "}
                        <span className="theme-text-muted font-normal">
                          {notif.text ||
                            (isFollowAccept
                              ? "accepted your follow request."
                              : notif.type === "LIKE_POST"
                              ? "liked your photo post."
                              : notif.type === "LIKE_REEL"
                              ? "liked your reel."
                              : "interacted with your profile.")}
                        </span>
                      </p>
                      <span className="text-[9px] theme-text-muted font-mono mt-0.5">
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-xl theme-accent-tint shrink-0">
                    {isFollowAccept ? (
                      <FiUserCheck size={14} className="theme-accent-text" />
                    ) : (
                      <FiMessageSquare size={14} className="theme-accent-text" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;