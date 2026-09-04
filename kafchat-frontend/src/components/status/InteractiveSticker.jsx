import { useState } from "react";
import { FiSend } from "react-icons/fi";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const InteractiveSticker = ({
  sticker,
  statusId,
  isOwn,
  onOpenProfile,
  onMentionTap,
}) => {
  const { user } = useAuth();
  const currentUserId = (user?._id || user?.id)?.toString();

  const [qaInput, setQaInput] = useState("");
  const [qaSubmitted, setQaSubmitted] = useState(false);
  const [localSticker, setLocalSticker] = useState(sticker);
  const [hasVotedSlider, setHasVotedSlider] = useState(false);

  const totalVotes =
    localSticker.pollOptions?.reduce(
      (acc, opt) => acc + (opt.votes?.length || 0),
      0
    ) || 0;
  const userVotedOptionIndex = localSticker.pollOptions?.findIndex((opt) =>
    opt.votes?.some((v) => (v?._id || v)?.toString() === currentUserId)
  );

  const handleVotePoll = async (optionIndex) => {
    if (userVotedOptionIndex !== -1 || isOwn) return;
    try {
      const { data } = await api.post(
        `/status/${statusId}/stickers/${sticker._id}/poll-vote`,
        { optionIndex }
      );
      if (data?.success && data.sticker) {
        setLocalSticker(data.sticker);
      }
      toast.success("Vote recorded!");
    } catch {
      toast.error("Could not record vote");
    }
  };

  const handleQaSubmit = async () => {
    if (!qaInput.trim() || isOwn) return;
    try {
      await api.post(`/status/${statusId}/stickers/${sticker._id}/qa-reply`, {
        response: qaInput.trim(),
      });
      setQaSubmitted(true);
      setQaInput("");
      toast.success("Sent to creator!");
    } catch {
      toast.error("Could not send response");
    }
  };

  const handleEmojiSliderTouch = async () => {
    if (isOwn || hasVotedSlider) return;
    try {
      setHasVotedSlider(true);
      await api.post(`/status/${statusId}/stickers/${sticker._id}/slider-vote`, {
        value: 100,
      });
      toast.success("Reacted!");
    } catch {
      // non-critical
    }
  };

  const handleMentionClick = (e) => {
    e.stopPropagation();
    const rawUsername = localSticker.value?.replace(/^@+/, "")?.trim();
    if (!rawUsername) return;

    if (onOpenProfile) {
      onOpenProfile(rawUsername);
    } else if (onMentionTap) {
      onMentionTap(rawUsername);
    }
  };

  // TRUE INSTAGRAM FORMAT FOR MENTION AND #TAG
  if (localSticker.type === "mention" || localSticker.type === "hashtag") {
    const font = localSticker.fontFamily || "sans-serif";
    const styleType = localSticker.styleType || "pill";

    let badgeClasses =
      "px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 shadow-lg";

    if (styleType === "solid") {
      badgeClasses =
        "px-3.5 py-1.5 rounded-xl bg-white text-black font-black text-xs shadow-xl border border-black/10";
    } else if (styleType === "neon") {
      badgeClasses =
        "px-4 py-1.5 rounded-full bg-black/80 text-pink-400 font-extrabold text-xs shadow-[0_0_12px_rgba(236,72,153,0.7)] border border-pink-400";
    } else if (styleType === "classic") {
      badgeClasses =
        "px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white font-bold text-xs shadow-lg border border-white/30";
    }

    if (localSticker.type === "mention") {
      return (
        <button
          type="button"
          onClick={handleMentionClick}
          className={`${badgeClasses} hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer select-none inline-flex items-center justify-center whitespace-nowrap`}
          style={{ fontFamily: font }}
        >
          <span>{localSticker.value}</span>
        </button>
      );
    }

    return (
      <span
        className={`${badgeClasses} inline-flex items-center justify-center select-none whitespace-nowrap`}
        style={{ fontFamily: font }}
      >
        {localSticker.value}
      </span>
    );
  }

  // Pure Floating Emoji Slider
  if (localSticker.type === "slider") {
    return (
      <div
        onClick={handleEmojiSliderTouch}
        className="flex flex-col items-center justify-center cursor-pointer select-none group active:scale-125 transition-transform"
      >
        <span className="text-5xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] animate-pulse">
          {localSticker.sliderEmoji || "🔥"}
        </span>
      </div>
    );
  }

  // Poll
  if (localSticker.type === "poll") {
    return (
      <div className="w-56 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col gap-2 select-none">
        <p className="text-white text-xs font-black text-center truncate">
          {localSticker.pollQuestion || "Vote Now"}
        </p>
        <div className="flex flex-col gap-1.5">
          {localSticker.pollOptions?.map((opt, idx) => {
            const hasVotedThis = userVotedOptionIndex === idx;
            const percentage =
              totalVotes > 0
                ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100)
                : 0;
            const showPercentage = userVotedOptionIndex !== -1 || isOwn;

            return (
              <button
                key={opt._id || idx}
                type="button"
                onClick={() => handleVotePoll(idx)}
                disabled={userVotedOptionIndex !== -1 || isOwn}
                className={`relative w-full h-8 rounded-xl overflow-hidden text-xs font-bold transition flex items-center justify-between px-3 ${
                  hasVotedThis
                    ? "border border-cyan-400 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {showPercentage && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500/40 to-blue-500/40 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <span className="relative z-10 truncate">{opt.text}</span>
                {showPercentage && (
                  <span className="relative z-10 font-mono text-[10px]">
                    {percentage}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Q&A
  if (localSticker.type === "qa") {
    return (
      <div className="w-60 p-3 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 backdrop-blur-md border border-pink-400/40 shadow-2xl flex flex-col gap-2">
        <div className="bg-white/10 p-2 rounded-xl text-center">
          <p className="text-pink-300 text-[11px] font-black uppercase tracking-wider">
            {localSticker.qaQuestion || "Ask me anything"}
          </p>
        </div>
        {qaSubmitted ? (
          <div className="p-2 text-center text-xs text-emerald-400 font-bold">
            Response Sent! ✨
          </div>
        ) : isOwn ? (
          <div className="p-1.5 text-center text-[10px] text-slate-300 italic">
            Responses go to your direct chats
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-black/50 border border-white/20 rounded-xl px-2.5 py-1">
            <input
              type="text"
              value={qaInput}
              onChange={(e) => setQaInput(e.target.value)}
              placeholder="Type something..."
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={handleQaSubmit}
              className="text-pink-400 hover:text-white p-1"
            >
              <FiSend size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
      {localSticker.value}
    </span>
  );
};

export default InteractiveSticker;