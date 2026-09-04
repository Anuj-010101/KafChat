import { useState, useEffect } from "react";
import {
  FiX,
  FiAtSign,
  FiHash,
  FiCheckSquare,
  FiHelpCircle,
  FiSmile,
  FiSearch,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import api from "../../services/api";

const StickerDrawer = ({ onClose, onSelectSticker }) => {
  const [tab, setTab] = useState("mention");
  const [inputValue, setInputValue] = useState("");

  // Mention Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Poll / QA / Slider states
  const [pollQuestion, setPollQuestion] = useState("");
  const [optionA, setOptionA] = useState("Yes");
  const [optionB, setOptionB] = useState("No");
  const [qaQuestion, setQaQuestion] = useState("Ask me anything");
  const [sliderEmoji, setSliderEmoji] = useState("🔥");

  // Instant User Search on 1st Letter Type
  useEffect(() => {
    if (tab !== "mention") {
      setSuggestions([]);
      return;
    }

    const cleanQuery = inputValue.replace(/^@+/, "").trim();
    if (!cleanQuery) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data } = await api.get(
          `/users/search?q=${encodeURIComponent(cleanQuery)}`
        );
        if (data?.success && Array.isArray(data.users)) {
          setSuggestions(data.users);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 150); // Fast 150ms debounce for instant 1st-letter feel

    return () => clearTimeout(timer);
  }, [inputValue, tab]);

  const handleSelectMentionUser = (userItem) => {
    onSelectSticker({
      type: "mention",
      value: `@${userItem.username}`,
      targetUserId: userItem._id,
      targetUser: {
        _id: userItem._id,
        username: userItem.username,
        fullName: userItem.fullName,
        avatar: userItem.avatar,
      },
      fontFamily: "sans-serif",
      styleType: "pill",
      x: 50,
      y: 40,
      scale: 1,
    });
    onClose();
  };

  const handleManualAdd = () => {
    if (tab === "mention" && inputValue.trim()) {
      const cleanUser = inputValue.trim().replace(/^@+/, "");
      onSelectSticker({
        type: "mention",
        value: `@${cleanUser}`,
        fontFamily: "sans-serif",
        styleType: "pill",
        x: 50,
        y: 40,
        scale: 1,
      });
      onClose();
    } else if (tab === "hashtag" && inputValue.trim()) {
      onSelectSticker({
        type: "hashtag",
        value: inputValue.trim(),
        fontFamily: "sans-serif",
        styleType: "pill",
        x: 50,
        y: 45,
        scale: 1,
      });
      onClose();
    } else if (tab === "poll") {
      if (!pollQuestion.trim()) return;
      onSelectSticker({
        type: "poll",
        pollQuestion: pollQuestion.trim(),
        pollOptions: [
          { text: optionA.trim() || "Yes", votes: [] },
          { text: optionB.trim() || "No", votes: [] },
        ],
        x: 50,
        y: 50,
        scale: 1,
      });
      onClose();
    } else if (tab === "qa") {
      onSelectSticker({
        type: "qa",
        qaQuestion: qaQuestion.trim() || "Ask me anything",
        qaResponses: [],
        x: 50,
        y: 50,
        scale: 1,
      });
      onClose();
    } else if (tab === "slider") {
      onSelectSticker({
        type: "slider",
        sliderEmoji: sliderEmoji || "🔥",
        sliderVotes: [],
        x: 50,
        y: 50,
        scale: 1,
      });
      onClose();
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 p-4 theme-panel-bg backdrop-blur-2xl border-t theme-border rounded-t-3xl flex flex-col gap-3 animate-bubbleIn select-none max-h-[85vh] overflow-y-auto shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b theme-border">
        <span className="text-xs font-bold theme-text uppercase tracking-wider">
          Stickers & Mentions
        </span>
        <button
          type="button"
          onClick={onClose}
          className="theme-text-muted hover:theme-text p-1"
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1">
        {[
          { id: "mention", label: "Mention", icon: FiAtSign },
          { id: "hashtag", label: "Text/Tag", icon: FiHash },
          { id: "poll", label: "Poll", icon: FiCheckSquare },
          { id: "qa", label: "Q&A", icon: FiHelpCircle },
          { id: "slider", label: "Slider", icon: FiSmile },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setInputValue("");
              }}
              className={`py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition ${
                tab === t.id
                  ? "bg-cyan-500 text-black shadow"
                  : "theme-soft-bg theme-text-muted"
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mention with 1st-Letter Auto-Suggestions */}
      {tab === "mention" && (
        <div className="flex flex-col gap-2 pt-1">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type username (e.g. anuj)..."
              className="w-full theme-soft-bg border theme-border rounded-xl pl-9 pr-4 py-2.5 text-xs theme-text outline-none focus:border-cyan-400"
              autoFocus
            />
            <FiSearch className="absolute left-3 text-gray-400" size={14} />
          </div>

          {/* Instagram-style Horizontal Suggestion Bar */}
          {inputValue.trim().length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] text-gray-400 font-medium">
                {loadingSuggestions ? "Searching users..." : "Tap user to tag:"}
              </span>

              {suggestions.length > 0 ? (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                  {suggestions.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => handleSelectMentionUser(item)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 shrink-0 transition"
                    >
                      <Avatar
                        src={item.avatar}
                        alt={item.fullName}
                        size="xs"
                        className="w-5 h-5"
                      />
                      <span className="text-xs font-bold text-white font-mono">
                        @{item.username}
                      </span>
                    </button>
                  ))}
                </div>
              ) : !loadingSuggestions ? (
                <p className="text-[11px] text-gray-500 py-1 italic">
                  No users found matching "{inputValue.replace(/^@/, "")}"
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Clean Tag Sticker */}
      {tab === "hashtag" && (
        <div className="flex flex-col gap-2 pt-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type any label or custom text"
            className="w-full theme-soft-bg border theme-border rounded-xl px-4 py-2.5 text-xs theme-text outline-none focus:border-cyan-400"
            autoFocus
          />
        </div>
      )}

      {/* Poll */}
      {tab === "poll" && (
        <div className="flex flex-col gap-2 pt-1">
          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full theme-soft-bg border theme-border rounded-xl px-4 py-2 text-xs theme-text outline-none focus:border-cyan-400"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder="Option 1"
              className="flex-1 theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none"
            />
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder="Option 2"
              className="flex-1 theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none"
            />
          </div>
        </div>
      )}

      {/* Q&A */}
      {tab === "qa" && (
        <div className="flex flex-col gap-2 pt-1">
          <input
            type="text"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            placeholder="Header prompt (e.g. Ask me anything)"
            className="w-full theme-soft-bg border theme-border rounded-xl px-4 py-2 text-xs theme-text outline-none focus:border-cyan-400"
            autoFocus
          />
        </div>
      )}

      {/* Slider */}
      {tab === "slider" && (
        <div className="flex items-center justify-around py-2 theme-soft-bg rounded-xl">
          {["🔥", "❤️", "😂", "😍", "👏", "💯"].map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setSliderEmoji(em)}
              className={`text-2xl p-1.5 rounded-xl transition ${
                sliderEmoji === em ? "bg-white/20 scale-125" : "hover:scale-110"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleManualAdd}
        className="w-full py-2.5 rounded-xl bg-cyan-400 text-black font-bold text-xs hover:opacity-90 transition mt-1"
      >
        Place on Canvas
      </button>
    </div>
  );
};

export default StickerDrawer;