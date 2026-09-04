    import { useEffect, useState } from "react";
import { FiX, FiHeart, FiSend } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { useStatus } from "../../hooks/useStatus";
import { useChat } from "../../hooks/useChat";

const StoryViewer = ({ storyItem, onClose }) => {
  const { markViewed } = useStatus() || {};
  const { startChatWithUser, sendMessage } = useChat();
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (storyItem?._id && markViewed) {
      markViewed(storyItem._id);
    }
  }, [storyItem, markViewed]);

  if (!storyItem) return null;

  const handleReplySubmit = async () => {
    if (!reply.trim()) return;
    try {
      const authorId = storyItem.user?._id || storyItem.user;
      if (startChatWithUser) await startChatWithUser(authorId);
      if (sendMessage) {
        await sendMessage({
          text: `Replied to story: "${reply.trim()}"`,
          mediaType: storyItem.mediaType === "image" ? "image" : "none",
          mediaUrl: storyItem.mediaType === "image" ? storyItem.mediaUrl : null,
        });
      }
      setReply("");
      onClose();
    } catch {
      // Handle error
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none animate-fadeIn">
      <div className="relative w-full max-w-sm h-full sm:h-[88vh] sm:rounded-3xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl">
        {/* Top Bar */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2.5">
            <Avatar src={storyItem.user?.avatar} alt={storyItem.user?.fullName} size="sm" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{storyItem.user?.fullName || "User"}</span>
              <span className="text-[10px] text-slate-400 font-mono">Just now</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black transition">
            <FiX size={18} />
          </button>
        </div>

        {/* Media Container */}
        <div
          className="flex-1 flex items-center justify-center p-4 text-center"
          style={{ backgroundColor: storyItem.mediaType === "text" ? storyItem.backgroundColor || "#0f172a" : "#000" }}
        >
          {storyItem.mediaType === "text" ? (
            <p className="text-white text-xl font-bold px-6 leading-relaxed">{storyItem.text}</p>
          ) : (
            <img src={storyItem.mediaUrl} alt="Story" className="max-h-[75vh] max-w-full object-contain rounded-2xl" />
          )}
        </div>

        {/* Bottom Reply Bar */}
        <div className="absolute bottom-4 inset-x-3 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReplySubmit()}
            placeholder="Reply to story..."
            className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-400 outline-none"
          />
          <button onClick={handleReplySubmit} className="text-cyan-400 hover:text-white transition p-1">
            <FiSend size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;