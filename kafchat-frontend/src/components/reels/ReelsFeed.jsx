import { useState } from "react";
import { FiHeart, FiShare2, FiMusic, FiDownload } from "react-icons/fi";
import Avatar from "../common/Avatar";
import toast from "react-hot-toast";

const ReelsFeed = ({ reel, onLike }) => {
  const [isLiked, setIsLiked] = useState(false);
  const author = reel?.creator || reel?.author;

  const handleReelLike = () => {
    setIsLiked((prev) => !prev);
    if (onLike) onLike(reel._id);
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        src={reel?.videoUrl || reel?.mediaUrl}
        loop
        playsInline
        autoPlay
        className="w-full h-full object-cover"
        onDoubleClick={handleReelLike}
      />

      {/* Right Sidebar Action Buttons */}
      <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
        <button onClick={handleReelLike} className="flex flex-col items-center gap-1 group">
          <div className={`p-2.5 rounded-full backdrop-blur-md transition ${isLiked ? "bg-pink-500 text-white scale-110" : "bg-black/40 text-white"}`}>
            <FiHeart size={20} className={isLiked ? "fill-white" : ""} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow">{reel?.likes?.length || 0}</span>
        </button>

        <button onClick={() => toast.success("Reel link copied!")} className="flex flex-col items-center gap-1 group">
          <div className="p-2.5 rounded-full bg-black/40 text-white backdrop-blur-md">
            <FiShare2 size={18} />
          </div>
          <span className="text-[10px] font-bold text-white">Share</span>
        </button>
      </div>

      {/* Bottom Info Details */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent pt-6 pr-14">
        <div className="flex items-center gap-2.5">
          <Avatar src={author?.avatar} alt={author?.fullName} size="sm" />
          <span className="text-xs font-bold text-white">{author?.fullName || "Creator"}</span>
        </div>
        {reel?.caption && <p className="text-xs text-white/90 font-medium">{reel.caption}</p>}
      </div>
    </div>
  );
};

export default ReelsFeed;