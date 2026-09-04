import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiHeart,
  FiShare2,
  FiMusic,
  FiVolume2,
  FiVolumeX,
  FiDownload,
  FiUsers,
  FiSearch,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const ReelsFeedModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isVip = Boolean(user?.isVIP);

  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [likedReelIds, setLikedReelIds] = useState(new Set());
  const [likesCounts, setLikesCounts] = useState({});
  const [showLikersDrawer, setShowLikersDrawer] = useState(false);
  const [likersList, setLikersList] = useState([]);
  const [likersSearch, setLikersSearch] = useState("");
  const [loadingLikers, setLoadingLikers] = useState(false);
  const videoRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchReels = async () => {
      try {
        const { data } = await api.get("/reels/feed");
        const reelList = data.reels || [];
        setReels(reelList);

        const counts = {};
        const liked = new Set();
        reelList.forEach((r) => {
          counts[r._id] = r.likes?.length || 0;
          if (r.likes?.some((id) => (id?._id || id)?.toString() === user?._id?.toString())) {
            liked.add(r._id);
          }
        });
        setLikesCounts(counts);
        setLikedReelIds(liked);
      } catch (err) {
        console.error("Reels fetch error:", err);
      }
    };
    fetchReels();
  }, [isOpen, user?._id]);

  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === currentIndex && isOpen) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentIndex, isOpen, reels]);

  if (!isOpen) return null;

  const handleLike = async (reelId) => {
    try {
      const isLiked = likedReelIds.has(reelId);
      setLikedReelIds((prev) => {
        const updated = new Set(prev);
        if (isLiked) updated.delete(reelId);
        else updated.add(reelId);
        return updated;
      });

      setLikesCounts((prev) => ({
        ...prev,
        [reelId]: Math.max(0, (prev[reelId] || 0) + (isLiked ? -1 : 1)),
      }));

      await api.post(`/reels/${reelId}/like`);
    } catch {
      toast.error("Failed to like reel");
    }
  };

  const handleOpenLikers = async (reelId) => {
    try {
      setShowLikersDrawer(true);
      setLoadingLikers(true);
      const { data } = await api.get(`/reels/${reelId}/likers`);
      setLikersList(data.likers || []);
    } catch {
      toast.error("Failed to load likers");
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleDownload = async (reel) => {
    try {
      const toastId = toast.loading(
        isVip ? "Downloading Clean HD Reel..." : "Downloading Standard Reel..."
      );
      const { data } = await api.get(`/reels/${reel._id}/download`);
      toast.dismiss(toastId);

      const targetUrl = data.downloadUrl || reel.videoUrl || reel.mediaUrl;
      if (targetUrl) {
        const link = document.createElement("a");
        link.href = targetUrl;
        link.download = `KafChat_Reel_${reel._id}.mp4`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (isVip) {
          toast.success("VIP PRO: Clean HD Reel Saved! 🚀");
        } else {
          toast.success("Reel Downloaded!");
        }
      }
    } catch {
      toast.error("Failed to download reel");
    }
  };

  const handleShare = (reel) => {
    if (navigator.share) {
      navigator
        .share({ title: reel.caption || "Reel", url: reel.videoUrl || reel.mediaUrl })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(reel.videoUrl || reel.mediaUrl);
      toast.success("Reel link copied! 📋");
    }
  };

  const filteredLikers = likersList.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(likersSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(likersSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none">
      <div className="relative w-full h-full max-w-md bg-black flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:border sm:border-white/10 sm:max-h-[95vh] shadow-2xl">
        {/* Top Floating Controls */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <span className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            🎬{" "}
            <span className="bg-gradient-to-r from-pink-500 to-amber-400 bg-clip-text text-transparent">
              Reels Feed
            </span>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition"
            >
              {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Reels Vertical Player */}
        {reels.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-14 h-14 rounded-3xl bg-pink-500/10 text-pink-400 flex items-center justify-center text-2xl mb-2">
              🎬
            </div>
            <p className="text-sm font-semibold text-white">No reels published yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Open Camera Studio to record 720p HD video reels!
            </p>
          </div>
        ) : (
          <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
            {reels.map((reel, idx) => {
              if (Math.abs(idx - currentIndex) > 1) return null;
              const isLiked = likedReelIds.has(reel._id);
              const author = reel.creator || reel.author;

              return (
                <div
                  key={reel._id}
                  className={`absolute inset-0 w-full h-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "opacity-100 scale-100 z-10"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <video
                    ref={(el) => (videoRefs.current[idx] = el)}
                    src={reel.videoUrl || reel.mediaUrl}
                    loop
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                    onDoubleClick={() => handleLike(reel._id)}
                  />

                  {/* Right Action Icons Bar */}
                  <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
                    {/* Like Action */}
                    <button
                      type="button"
                      onClick={() => handleLike(reel._id)}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div
                        className={`p-2.5 rounded-full backdrop-blur-md transition ${
                          isLiked
                            ? "bg-pink-500 text-white scale-110"
                            : "bg-black/40 text-white group-hover:bg-black/60"
                        }`}
                      >
                        <FiHeart size={20} className={isLiked ? "fill-white" : ""} />
                      </div>
                      <span className="text-[11px] font-bold text-white drop-shadow">
                        {likesCounts[reel._id] || 0}
                      </span>
                    </button>

                    {/* Likers List Trigger */}
                    <button
                      type="button"
                      onClick={() => handleOpenLikers(reel._id)}
                      className="flex flex-col items-center gap-1 group"
                      title="View Likers"
                    >
                      <div className="p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md group-hover:bg-black/60 transition">
                        <FiUsers size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow">Likers</span>
                    </button>

                    {/* Downloader Button */}
                    <button
                      type="button"
                      onClick={() => handleDownload(reel)}
                      className="flex flex-col items-center gap-1 group"
                      title={isVip ? "Download Clean HD" : "Download Standard"}
                    >
                      <div className="p-2.5 rounded-full bg-cyan-500/80 text-black backdrop-blur-md hover:bg-cyan-400 transition">
                        <FiDownload size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-cyan-300 drop-shadow">
                        {isVip ? "HD Save" : "Save"}
                      </span>
                    </button>

                    {/* Share Action */}
                    <button
                      type="button"
                      onClick={() => handleShare(reel)}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md group-hover:bg-black/60 transition">
                        <FiShare2 size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-white drop-shadow">Share</span>
                    </button>
                  </div>

                  {/* Bottom Creator & Caption Info */}
                  <div className="absolute bottom-4 inset-x-4 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/95 via-black/50 to-transparent pt-6 pr-14">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={author?.avatar} alt={author?.fullName} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate drop-shadow flex items-center gap-1">
                          {author?.fullName || "User"}
                          {author?.isVIP && (
                            <span className="text-[9px] bg-amber-500 text-black font-extrabold px-1.5 py-0.2 rounded-full">
                              VIP
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono font-semibold truncate drop-shadow">
                          @{author?.username}
                        </span>
                      </div>
                    </div>

                    {reel.caption && (
                      <p className="text-xs text-white/95 line-clamp-2 drop-shadow font-medium">
                        {reel.caption}
                      </p>
                    )}

                    {reel.audioTrack?.title && (
                      <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-mono">
                        <FiMusic size={12} className="animate-spin" />
                        <span className="truncate">{reel.audioTrack.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Swipe Navigation */}
        {reels.length > 1 && (
          <div className="absolute bottom-1 inset-x-0 z-30 flex items-center justify-center gap-2 py-1">
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md"
              >
                ▲ Prev
              </button>
            )}
            {currentIndex < reels.length - 1 && (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md"
              >
                ▼ Next
              </button>
            )}
          </div>
        )}

        {/* Likers List Slide-up Drawer */}
        {showLikersDrawer && (
          <div
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-fadeIn"
            onClick={() => setShowLikersDrawer(false)}
          >
            <div
              className="w-full bg-[#0d131f] border-t border-slate-800 rounded-t-3xl p-4 flex flex-col gap-3 max-h-[60vh] h-[400px] animate-bubbleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FiHeart className="text-pink-500 fill-pink-500" /> Liked by {likersList.length}{" "}
                  people
                </span>
                <button
                  onClick={() => setShowLikersDrawer(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <FiX size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121929] border border-slate-700 rounded-xl text-xs">
                <FiSearch className="text-slate-400" size={13} />
                <input
                  type="text"
                  value={likersSearch}
                  onChange={(e) => setLikersSearch(e.target.value)}
                  placeholder="Search likers..."
                  className="bg-transparent text-white outline-none w-full placeholder:text-slate-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2">
                {loadingLikers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  </div>
                ) : filteredLikers.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">
                    No matching likes found
                  </p>
                ) : (
                  filteredLikers.map((liker) => (
                    <div
                      key={liker._id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#121929]/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={liker.avatar} alt={liker.fullName} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-white truncate">
                            {liker.fullName}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            @{liker.username}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toast.success(`Connected with @${liker.username}`)}
                        className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500 hover:text-black transition"
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
      </div>
    </div>
  );
};

export default ReelsFeedModal;