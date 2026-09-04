import { useState, useMemo } from "react";
import {
  FiX,
  FiZap,
  FiTrendingUp,
  FiSearch,
} from "react-icons/fi";

const GIF_CATEGORIES = [
  { id: "all", label: "🌟 All" },
  { id: "bubu", label: "🐼 Bubu-Dudu" },
  { id: "greetings", label: "👋 Hi & Greetings" },
  { id: "reactions", label: "😂 Reactions" },
  { id: "love", label: "❤️ Love & Hugs" },
  { id: "dance", label: "💃 Dance & Party" },
  { id: "anime", label: "✨ Anime & Chill" },
];

const PRESET_GIFS = {
  bubu: [
    "https://media.giphy.com/media/9XY4f3C0T4j0XQ1z7F/giphy.gif",
    "https://media.giphy.com/media/26vUCLEP2ZJcpxA2Y/giphy.gif",
    "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif",
    "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
    "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
    "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif",
  ],
  greetings: [
    "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif",
    "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif",
    "https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif",
    "https://media.giphy.com/media/ASd0Ukj0BCkeKT3WfW/giphy.gif",
    "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
    "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  ],
  reactions: [
    "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
    "https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif",
    "https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif",
    "https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif",
    "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
    "https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif",
  ],
  love: [
    "https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif",
    "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
    "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif",
  ],
  dance: [
    "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    "https://media.giphy.com/media/mKMGLhoD8L4yc/giphy.gif",
    "https://media.giphy.com/media/13hxeOYjoTWtK8/giphy.gif",
    "https://media.giphy.com/media/pa37AAGzKXoek/giphy.gif",
    "https://media.giphy.com/media/l2JhpjphERFai5ZOo/giphy.gif",
  ],
  anime: [
    "https://media.giphy.com/media/12b3E4U9aSndxC/giphy.gif",
    "https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif",
    "https://media.giphy.com/media/89asT84PzDwpW/giphy.gif",
    "https://media.giphy.com/media/Y4z9olnoVlGzVQCcCi/giphy.gif",
  ],
};

const BITMOJI_THEMES = [
  { id: "hi", label: "Saying Hi 👋", caption: "Hey Buddy!", icon: "👋" },
  { id: "bff", label: "Best Friends 🤝", caption: "BFFs Forever", icon: "🤝" },
  { id: "highfive", label: "High Five ✋", caption: "Teamwork High Five!", icon: "✋" },
  { id: "hugs", label: "Warm Hugs 🤗", caption: "Big Warm Hug", icon: "🤗" },
  { id: "party", label: "Party Vibes 🎉", caption: "Let's Celebrate!", icon: "🎉" },
  { id: "gaming", label: "Gaming Duo 🎮", caption: "Duo Victory!", icon: "🎮" },
  { id: "coding", label: "Coding Sprint 💻", caption: "Building Next Big Thing", icon: "💻" },
  { id: "coffee", label: "Coffee Break ☕", caption: "Coffee Time Catchup", icon: "☕" },
  { id: "pizza", label: "Foodie Treats 🍕", caption: "Pizza Party Together", icon: "🍕" },
  { id: "chilling", label: "Chill Mode 🕶️", caption: "No Stress Zone", icon: "🕶️" },
  { id: "music", label: "Jamming Out 🎧", caption: "Vibing on Repeat", icon: "🎧" },
  { id: "secret", label: "Top Secret 🤫", caption: "Our Little Secret", icon: "🤫" },
];

const BitmojiStickerModal = ({ isOpen, onClose, onSendMedia, myUser, otherUser }) => {
  const [activeTab, setActiveTab] = useState("bitmoji");
  const [gifCategory, setGifCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const myAvatar = myUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=me";
  const partnerAvatar = otherUser?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=friend";
  const partnerName = otherUser?.fullName?.split(" ")[0] || "Friend";

  const allGifs = useMemo(() => Object.values(PRESET_GIFS).flat(), []);

  const displayedGifs = useMemo(() => {
    if (searchQuery.trim()) {
      return allGifs.filter((_, idx) => idx % 2 === 0);
    }
    if (gifCategory === "all") return allGifs;
    return PRESET_GIFS[gifCategory] || allGifs;
  }, [gifCategory, searchQuery, allGifs]);

  if (!isOpen) return null;

  const handleSelectGif = (gifUrl) => {
    if (onSendMedia) {
      onSendMedia({ mediaUrl: gifUrl, mediaType: "image", caption: "GIF" });
    }
    onClose();
  };

  const handleSelectBitmoji = (theme) => {
    // Extra-compact SVG dimensions (width 150, height 90) for clean inline sticker sizing
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="150" height="90" viewBox="0 0 150 90">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#db2777" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" rx="16" fill="url(#bgGrad)" />
        <rect x="4" y="4" width="142" height="82" rx="12" fill="#0f172a" fill-opacity="0.9" />
        
        <!-- Left Avatar -->
        <g transform="translate(18, 14)" filter="url(#shadow)">
          <circle cx="18" cy="18" r="16" fill="#38bdf8" />
          <image href="${myAvatar}" x="2" y="2" width="32" height="32" clip-path="inset(0% round 16px)"/>
        </g>
        
        <!-- Center Emoji -->
        <circle cx="75" cy="32" r="11" fill="#f59e0b" filter="url(#shadow)" />
        <text x="75" y="37" font-size="11" text-anchor="middle" font-family="sans-serif">${theme.icon}</text>

        <!-- Right Avatar -->
        <g transform="translate(96, 14)" filter="url(#shadow)">
          <circle cx="18" cy="18" r="16" fill="#ec4899" />
          <image href="${partnerAvatar}" x="2" y="2" width="32" height="32" clip-path="inset(0% round 16px)"/>
        </g>

        <!-- Caption Tag -->
        <rect x="12" y="58" width="126" height="20" rx="6" fill="#1e293b" stroke="#ffffff22" />
        <text x="75" y="71" font-size="8" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="sans-serif">
          ${theme.caption}
        </text>
      </svg>
    `;

    const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    if (onSendMedia) {
      onSendMedia({
        mediaUrl: encodedSvg,
        mediaType: "image",
        caption: `✨ Dual Bitmoji: ${theme.caption}`,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md theme-panel-bg border-t sm:border theme-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] h-[500px] animate-bubbleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 py-3 border-b theme-border theme-soft-bg/40">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl theme-soft-bg border theme-border">
            <button
              type="button"
              onClick={() => setActiveTab("bitmoji")}
              className={`px-3.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === "bitmoji"
                  ? "theme-accent-bg text-white shadow"
                  : "theme-text-muted hover:theme-text"
              }`}
            >
              <FiZap size={13} /> Bitmoji
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gif")}
              className={`px-3.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === "gif"
                  ? "theme-accent-bg text-white shadow"
                  : "theme-text-muted hover:theme-text"
              }`}
            >
              <FiTrendingUp size={13} /> GIFs
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full theme-text-muted hover:theme-text hover:theme-soft-bg transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3.5 flex flex-col gap-3">
          {activeTab === "bitmoji" && (
            <div className="grid grid-cols-2 gap-2.5">
              {BITMOJI_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectBitmoji(theme)}
                  className="p-2.5 rounded-2xl theme-soft-bg border theme-border hover:theme-accent-border hover:scale-[1.02] flex flex-col items-center gap-1.5 text-center transition group shadow-sm"
                >
                  <div className="flex items-center justify-center -space-x-2.5 py-0.5">
                    <img src={myAvatar} alt="Me" className="w-9 h-9 rounded-full border-2 border-sky-400 bg-slate-800 object-cover group-hover:-translate-x-1 transition" />
                    <span className="z-10 text-sm drop-shadow">{theme.icon}</span>
                    <img src={partnerAvatar} alt="Friend" className="w-9 h-9 rounded-full border-2 border-pink-400 bg-slate-800 object-cover group-hover:translate-x-1 transition" />
                  </div>
                  <span className="text-[11px] font-bold theme-text group-hover:theme-accent-text transition truncate max-w-full">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "gif" && (
            <div className="flex flex-col gap-3">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-3 theme-text-muted" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search GIFs (bubu, love, dance, reactions)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl theme-soft-bg border theme-border text-xs theme-text outline-none theme-accent-focus"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 theme-text-muted hover:theme-text">
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {!searchQuery && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                  {GIF_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setGifCategory(cat.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition ${
                        gifCategory === cat.id
                          ? "theme-accent-bg text-white shadow"
                          : "theme-soft-bg theme-text-muted hover:theme-text"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {displayedGifs.map((gif, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectGif(gif)}
                    className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border theme-border cursor-pointer hover:scale-105 transition group shadow"
                  >
                    <img src={gif} alt="GIF" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                      Send 🚀
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BitmojiStickerModal;