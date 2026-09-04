import { useState, useEffect } from "react";
import {
  FiX,
  FiLock,
  FiMessageCircle,
  FiUserCheck,
  FiGrid,
  FiUsers,
} from "react-icons/fi";
import Avatar from "./Avatar";
import api from "../../services/api";
import { useChat } from "../../hooks/useChat";
import toast from "react-hot-toast";

const UserProfileModal = ({ username, onClose }) => {
  const { startChatWithUser } = useChat() || {};
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [networkList, setNetworkList] = useState([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const cleanUser = username.replace(/^@+/, "").trim();
        const { data } = await api.get(`/users/username/${encodeURIComponent(cleanUser)}`);
        if (data?.success && data?.user) {
          const fullRes = await api.get(`/users/${data.user._id}/profile`);
          setProfileData(fullRes.data);
        }
      } catch (err) {
        toast.error(`@${username} not found`);
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchProfile();
  }, [username, onClose]);

  const loadNetwork = async (type) => {
    if (!profileData?.user?._id) return;
    if (profileData?.user?.isPrivateAccount) {
      toast.error("This account is private");
      return;
    }
    setActiveTab(type);
    setLoadingNetwork(true);
    try {
      const { data } = await api.get(`/users/${profileData.user._id}/network`);
      if (data?.success) {
        setNetworkList(type === "followers" ? (data.followers || []) : (data.following || []));
      }
    } catch {
      toast.error("Failed to load list");
    } finally {
      setLoadingNetwork(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const u = profileData?.user;
  const posts = profileData?.posts || [];
  const isPrivate = Boolean(u?.isPrivateAccount);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0e1626] border border-slate-700/80 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-bubbleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-white font-mono tracking-tight">
              @{u?.username}
            </span>
            {u?.isVIP && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[8px] font-black">
                PRO
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div
              className="relative cursor-pointer group"
              onClick={() => setShowFullAvatar(true)}
              title="Tap to view full DP"
            >
              <Avatar
                src={u?.avatar}
                alt={u?.fullName}
                size="lg"
                className="ring-2 ring-cyan-400 group-hover:scale-105 transition"
              />
              <span className="absolute bottom-0 right-0 bg-black/70 text-[8px] text-white px-1 rounded-full">
                🔍
              </span>
            </div>

            <div className="flex items-center gap-5 text-center">
              <div>
                <span className="text-sm font-black text-white block">{posts.length}</span>
                <span className="text-[10px] text-slate-400">Posts</span>
              </div>
              <button
                type="button"
                onClick={() => loadNetwork("followers")}
                className="hover:opacity-80 transition cursor-pointer"
              >
                <span className="text-sm font-black text-white block">
                  {u?.followers?.length || 0}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => loadNetwork("following")}
                className="hover:opacity-80 transition cursor-pointer"
              >
                <span className="text-sm font-black text-white block">
                  {u?.following?.length || 0}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">Following</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-white">{u?.fullName}</h3>
            {u?.bio && (
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {u.bio}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (startChatWithUser && u?._id) {
                  startChatWithUser(u._id);
                  onClose();
                }
              }}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow hover:opacity-90 transition"
            >
              <FiMessageCircle size={14} /> Message
            </button>
          </div>

          {/* Tabs Selector */}
          <div className="flex border-b border-slate-800 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={`flex-1 pb-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === "posts"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400"
              }`}
            >
              <FiGrid size={13} /> Posts
            </button>
            <button
              type="button"
              onClick={() => loadNetwork("followers")}
              className={`flex-1 pb-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === "followers"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400"
              }`}
            >
              <FiUsers size={13} /> Followers
            </button>
            <button
              type="button"
              onClick={() => loadNetwork("following")}
              className={`flex-1 pb-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === "following"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400"
              }`}
            >
              <FiUserCheck size={13} /> Following
            </button>
          </div>

          {/* Tab Content Area */}
          {activeTab === "posts" ? (
            isPrivate ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xl">
                  <FiLock />
                </div>
                <h4 className="text-xs font-bold text-white">This Account is Private</h4>
                <p className="text-[10px] text-slate-400 max-w-[200px]">
                  Follow this account to see their photos and posts.
                </p>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500 font-mono">No posts yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {posts.map((post, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
                  >
                    {post.mediaUrl && (
                      <img
                        src={post.mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {loadingNetwork ? (
                <div className="py-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : networkList.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500 font-mono">
                  No {activeTab} found.
                </p>
              ) : (
                networkList.map((person) => (
                  <div
                    key={person._id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={person.avatar} alt={person.fullName} size="sm" />
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-xs font-bold text-white truncate">
                          {person.fullName}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono truncate">
                          @{person.username}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (startChatWithUser) {
                          startChatWithUser(person._id);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-cyan-500 hover:text-black text-white text-[10px] font-bold transition"
                    >
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showFullAvatar && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 animate-fadeIn"
          onClick={() => setShowFullAvatar(false)}
        >
          <div className="relative max-w-xs w-full aspect-square rounded-full overflow-hidden border-4 border-cyan-400 shadow-2xl">
            <img
              src={u?.avatar}
              alt={u?.fullName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;