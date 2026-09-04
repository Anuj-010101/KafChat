import { useState, useRef, useEffect } from "react";
import {
  FiX,
  FiType,
  FiImage,
  FiUploadCloud,
  FiSmile,
  FiMusic,
  FiDroplet,
  FiStar,
  FiGlobe,
  FiTrash2,
  FiEyeOff,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import { useStatus } from "../../hooks/useStatus";
import StickerDrawer from "./StickerDrawer";
import MusicPickerModal from "./MusicPickerModal";

const BG_COLORS = [
  "#0284C7",
  "#38BDF8",
  "#0F172A",
  "#1D4ED8",
  "#334155",
  "#059669",
  "#7C3AED",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];
const TEXT_COLORS = [
  "#ffffff",
  "#000000",
  "#F8FAFC",
  "#FACC15",
  "#4ADE80",
  "#38BDF8",
  "#F472B6",
  "#FB923C",
  "#A78BFA",
];

const FONTS = [
  { id: "sans-serif", name: "Modern" },
  { id: "serif", name: "Classic" },
  { id: "monospace", name: "Typewriter" },
  { id: "cursive", name: "Neon" },
  { id: "fantasy", name: "Bold" },
];

const TAG_STYLES = [
  { id: "pill", name: "Translucent" },
  { id: "solid", name: "Solid White" },
  { id: "neon", name: "Neon Glow" },
  { id: "classic", name: "Gradient" },
];

const CreateStatusModal = ({ onClose, initialReshareData = null }) => {
  const { postStatus } = useStatus();
  const isReshareMode = Boolean(initialReshareData);

  const [mode, setMode] = useState(isReshareMode ? "reshare" : "text");
  const [text, setText] = useState("");
  const [isTypingActive, setIsTypingActive] = useState(mode === "text");

  const [bgColor, setBgColor] = useState(
    isReshareMode ? initialReshareData.backgroundColor || BG_COLORS[0] : BG_COLORS[0]
  );
  const [textColor, setTextColor] = useState(
    isReshareMode ? initialReshareData.textColor || TEXT_COLORS[0] : TEXT_COLORS[0]
  );
  const [fontFamily, setFontFamily] = useState(FONTS[0].id);
  const [hasTextHighlight, setHasTextHighlight] = useState(false);

  const [mediaUrl, setMediaUrl] = useState(
    isReshareMode ? initialReshareData.mediaUrl || "" : ""
  );
  const [attachedSong, setAttachedSong] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [privacy, setPrivacy] = useState("everyone");
  const [duration, setDuration] = useState(10);

  const [showStickerDrawer, setShowStickerDrawer] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [selectedStickerIdx, setSelectedStickerIdx] = useState(null);
  const [activeDraggingIdx, setActiveDraggingIdx] = useState(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const activeIdxRef = useRef(null);
  const isOverTrashRef = useRef(false);

  // Multi-touch tracking
  const touchesRef = useRef(new Map());
  const initialPinchDistRef = useRef(null);
  const initialPinchScaleRef = useRef(1);

  // Touch Start Handler (Multi-touch enabled)
  const handleTouchStart = (idx, e) => {
    e.stopPropagation();
    activeIdxRef.current = idx;
    setActiveDraggingIdx(idx);
    setSelectedStickerIdx(idx);

    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = stickers[idx]?.scale || 1;
    }
  };

  const handleCanvasTouchStart = (e) => {
    if (e.touches.length === 2 && activeIdxRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchScaleRef.current = stickers[activeIdxRef.current]?.scale || 1;
    }
  };

  const handlePointerMove = (e) => {
    if (activeIdxRef.current === null || !canvasRef.current) return;

    // Pinch Zoom Handling (2 fingers)
    if (e.touches && e.touches.length === 2) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (initialPinchDistRef.current) {
        const factor = currentDist / initialPinchDistRef.current;
        const newScale = Math.max(0.3, Math.min(3.5, initialPinchScaleRef.current * factor));
        setStickers((prev) =>
          prev.map((st, i) => (i === activeIdxRef.current ? { ...st, scale: newScale } : st))
        );
      }
      return;
    }

    // 1 Finger Dragging
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const xPercent = ((clientX - rect.left) / rect.width) * 100;
    const yPercent = ((clientY - rect.top) / rect.height) * 100;

    const overTrash = yPercent > 80 && yPercent < 100 && xPercent > 30 && xPercent < 70;
    isOverTrashRef.current = overTrash;
    setIsOverTrash(overTrash);

    setStickers((prev) =>
      prev.map((st, i) =>
        i === activeIdxRef.current ? { ...st, x: xPercent, y: yPercent } : st
      )
    );
  };

  const handlePointerUp = () => {
    if (activeIdxRef.current !== null && isOverTrashRef.current) {
      const idxToDelete = activeIdxRef.current;
      setStickers((prev) => prev.filter((_, idx) => idx !== idxToDelete));
      setSelectedStickerIdx(null);
    }
    activeIdxRef.current = null;
    isOverTrashRef.current = false;
    initialPinchDistRef.current = null;
    setActiveDraggingIdx(null);
    setIsOverTrash(false);
  };

  useEffect(() => {
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      const payload = {
        mediaType: isReshareMode
          ? initialReshareData.mediaType || "text"
          : mode === "text"
          ? "text"
          : "image",
        mediaUrl: isReshareMode
          ? initialReshareData.mediaUrl
          : mode === "media"
          ? mediaUrl || null
          : null,
        text: isReshareMode ? initialReshareData.text : text.trim(),
        overlayText: isReshareMode ? text.trim() : "",
        backgroundColor: isReshareMode ? initialReshareData.backgroundColor || bgColor : bgColor,
        textColor: isReshareMode ? initialReshareData.textColor || textColor : textColor,
        fontFamily: fontFamily,
        hasTextHighlight: hasTextHighlight,
        privacy: privacy,
        duration: attachedSong ? Number(duration) || 15 : 10,
        stickers: stickers,
        isReshare: isReshareMode,
        originalAuthor: initialReshareData?.authorId || null,
        reshareSnapshot: isReshareMode
          ? {
              statusId: initialReshareData.statusId,
              authorId: initialReshareData.authorId,
              authorName: initialReshareData.authorName || "User",
              authorUsername: initialReshareData.authorUsername || "user",
              authorAvatar: initialReshareData.authorAvatar || "",
              mediaType: initialReshareData.mediaType || "text",
              mediaUrl: initialReshareData.mediaUrl || null,
              text: initialReshareData.text || "",
              backgroundColor: initialReshareData.backgroundColor || "#0284C7",
              textColor: initialReshareData.textColor || "#ffffff",
            }
          : null,
        attachedSong: attachedSong
          ? {
              title: attachedSong.title,
              artist: attachedSong.artist,
              audioUrl: attachedSong.audioUrl,
            }
          : null,
      };

      if (!isReshareMode && mode === "text" && !text.trim() && stickers.length === 0) return;
      if (!isReshareMode && mode === "media" && !mediaUrl) return;

      await postStatus(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const activeSticker = selectedStickerIdx !== null ? stickers[selectedStickerIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-3 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[92vh] max-h-[780px] relative overflow-hidden">
        {/* Top Instagram Action Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 z-30">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              {isReshareMode ? "Reshare Story" : "Story Studio"}
            </h2>
            <button
              type="button"
              onClick={() =>
                setPrivacy((prev) => (prev === "everyone" ? "close_friends" : "everyone"))
              }
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                privacy === "close_friends"
                  ? "bg-emerald-500 text-black shadow"
                  : "bg-white/10 text-white/70"
              }`}
            >
              {privacy === "close_friends" ? (
                <>
                  <FiStar size={9} className="fill-black" /> Close Friends
                </>
              ) : (
                <>
                  <FiGlobe size={9} /> Public
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Instagram Aa Text Button */}
            <button
              type="button"
              onClick={() => {
                setIsTypingActive((prev) => !prev);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
              className={`p-2 rounded-full transition ${
                isTypingActive || text
                  ? "bg-white text-black font-extrabold shadow"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Add text"
            >
              <FiType size={15} />
            </button>

            <button
              type="button"
              onClick={() => setHasTextHighlight((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-black text-xs border transition ${
                hasTextHighlight
                  ? "bg-white text-black border-white"
                  : "bg-white/10 text-white border-transparent"
              }`}
              title="Highlight"
            >
              A
            </button>

            <button
              type="button"
              onClick={() => setShowMusicModal(true)}
              className={`p-2 rounded-full transition ${
                attachedSong ? "bg-pink-500 text-white" : "bg-white/10 text-white"
              }`}
            >
              <FiMusic size={15} />
            </button>

            <button
              type="button"
              onClick={() => setShowStickerDrawer(true)}
              className={`p-2 rounded-full transition ${
                stickers.length > 0 ? "bg-cyan-500 text-black" : "bg-white/10 text-white"
              }`}
            >
              <FiSmile size={15} />
            </button>

            <button type="button" onClick={onClose} className="text-white/60 hover:text-white p-1">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        {!isReshareMode && (
          <div className="flex gap-1 px-4 pt-2 shrink-0 z-30">
            <button
              type="button"
              onClick={() => {
                setMode("text");
                setSelectedStickerIdx(null);
                setIsTypingActive(true);
              }}
              className={`flex-1 text-xs py-1.5 rounded-xl font-semibold transition ${
                mode === "text" ? "bg-cyan-500 text-black shadow" : "bg-white/5 text-white/50"
              }`}
            >
              Text Mode
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("media");
                setSelectedStickerIdx(null);
                setIsTypingActive(false);
              }}
              className={`flex-1 text-xs py-1.5 rounded-xl font-semibold transition ${
                mode === "media" ? "bg-cyan-500 text-black shadow" : "bg-white/5 text-white/50"
              }`}
            >
              Photo Mode
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Story Viewport Canvas */}
        <div
          ref={canvasRef}
          onTouchStart={handleCanvasTouchStart}
          onPointerMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onClick={(e) => {
            if (e.target === canvasRef.current) {
              setSelectedStickerIdx(null);
              if (mode === "text" || isTypingActive) textareaRef.current?.focus();
            }
          }}
          className="relative flex-1 m-3 rounded-2xl flex flex-col items-center justify-center select-none shadow-inner border border-white/10 overflow-hidden touch-none"
          style={{
            backgroundColor: isReshareMode ? bgColor : mode === "text" ? bgColor : "#000000",
          }}
        >
          {/* USER 1 ORIGINAL CARD (LOCKED IN RESHARE STUDIO) */}
          {isReshareMode && (
            <div className="w-[84%] max-h-[64%] rounded-2xl overflow-hidden border border-white/20 bg-black/60 shadow-2xl flex flex-col relative pointer-events-none z-10 select-none">
              <div className="p-2.5 bg-black/50 backdrop-blur-sm flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={initialReshareData.authorAvatar}
                    alt={initialReshareData.authorName || "User"}
                    size="xs"
                  />
                  <span className="text-[11px] font-bold text-white truncate font-mono">
                    @{initialReshareData.authorUsername || initialReshareData.authorName}
                  </span>
                </div>
                <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded">
                  Original
                </span>
              </div>

              <div
                className="flex-1 min-h-[160px] flex items-center justify-center p-4 text-center overflow-hidden"
                style={{
                  backgroundColor:
                    initialReshareData.mediaType === "text"
                      ? initialReshareData.backgroundColor || "#0284C7"
                      : "#000000",
                }}
              >
                {initialReshareData.mediaType === "text" ? (
                  <p
                    className="text-sm font-bold line-clamp-4 leading-relaxed"
                    style={{ color: initialReshareData.textColor || "#ffffff" }}
                  >
                    "{initialReshareData.text}"
                  </p>
                ) : (
                  <img
                    src={initialReshareData.mediaUrl}
                    alt="Original story"
                    className="w-full h-full object-cover max-h-[220px]"
                  />
                )}
              </div>
            </div>
          )}

          {/* Photo Canvas (Clean, No Forced Text) */}
          {!isReshareMode && mode === "media" && (
            <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-black">
              {mediaUrl ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img src={mediaUrl} alt="Story canvas" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white text-[10px] font-semibold px-3 py-1 rounded-lg border border-white/20 z-20"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 cursor-pointer p-6 text-center"
                >
                  <FiUploadCloud size={38} className="text-cyan-400 animate-bounce" />
                  <span className="text-xs font-bold text-white">Tap to upload photo</span>
                </div>
              )}
            </div>
          )}

          {/* Text Layer (Only active when typing or in text mode) */}
          {(mode === "text" || isTypingActive || text) && (
            <div
              className={`w-full px-4 text-center z-20 ${
                mode !== "text" ? "absolute bottom-16 inset-x-0" : ""
              }`}
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 500))}
                placeholder={mode === "text" ? "Tap to type..." : "Add a caption..."}
                rows={mode === "text" ? 4 : 2}
                className={`w-full bg-transparent font-bold text-center outline-none resize-none placeholder:opacity-40 transition-all ${
                  mode === "text" ? "text-2xl" : "text-base"
                } ${hasTextHighlight ? "px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-sm" : ""}`}
                style={{
                  color: textColor,
                  caretColor: textColor,
                  WebkitTextFillColor: textColor,
                  fontFamily: fontFamily,
                }}
                autoFocus={mode === "text" || isTypingActive}
              />
            </div>
          )}

          {/* Draggable & Pinch-Zoomable Stickers */}
          {stickers.map((st, idx) => {
            const isOffScreen = st.x < -10 || st.x > 110 || st.y < -10 || st.y > 110;
            const isSelected = selectedStickerIdx === idx;

            const badgeClasses =
              st.styleType === "solid"
                ? "bg-white text-black font-black border border-black/10"
                : st.styleType === "neon"
                ? "bg-black/80 text-pink-400 border border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.7)]"
                : st.styleType === "classic"
                ? "bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white border border-white/30"
                : "bg-black/60 backdrop-blur-md text-white border border-white/20";

            return (
              <div
                key={idx}
                onTouchStart={(e) => handleTouchStart(idx, e)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  activeIdxRef.current = idx;
                  setActiveDraggingIdx(idx);
                  setSelectedStickerIdx(idx);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStickerIdx(idx);
                }}
                style={{
                  left: `${st.x || 50}%`,
                  top: `${st.y || 50}%`,
                  transform: `translate(-50%, -50%) scale(${st.scale || 1})`,
                }}
                className={`absolute z-30 cursor-grab active:cursor-grabbing pointer-events-auto transition-transform duration-75 touch-none ${
                  isOffScreen
                    ? "opacity-25 ring-2 ring-dashed ring-amber-400 rounded-full"
                    : isSelected
                    ? "ring-2 ring-cyan-400 rounded-2xl shadow-xl"
                    : ""
                }`}
              >
                {st.type === "slider" ? (
                  <div className="flex flex-col items-center select-none pointer-events-auto filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
                    <span className="text-5xl animate-bounce leading-none">
                      {st.sliderEmoji || "🔥"}
                    </span>
                  </div>
                ) : st.type === "mention" || st.type === "hashtag" ? (
                  <span
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl transition-all inline-block whitespace-nowrap ${badgeClasses}`}
                    style={{ fontFamily: st.fontFamily || "sans-serif" }}
                  >
                    {st.value}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-2xl">
                    {st.type === "poll" ? (
                      <span className="text-xs font-bold truncate">📊 {st.pollQuestion}</span>
                    ) : st.type === "qa" ? (
                      <span className="text-xs font-bold truncate">❓ {st.qaQuestion}</span>
                    ) : (
                      <span className="text-xs font-bold">{st.value}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Trash Can Dropzone */}
          {activeDraggingIdx !== null && (
            <div
              onClick={() => handleRemoveStickerDirect(activeDraggingIdx)}
              className={`absolute bottom-3 inset-x-0 mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 z-40 cursor-pointer ${
                isOverTrash
                  ? "bg-red-500 text-white scale-125 shadow-lg shadow-red-500/50"
                  : "bg-black/60 text-white/70 border border-white/30 backdrop-blur-md hover:bg-red-500/80 hover:text-white"
              }`}
              title="Drag here to delete"
            >
              <FiTrash2 size={20} />
            </div>
          )}
        </div>

        {/* Selected Sticker Badge Customizer */}
        {activeSticker && (activeSticker.type === "mention" || activeSticker.type === "hashtag") && (
          <div className="px-4 py-1.5 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              {activeSticker.type === "mention" ? "Style @Mention" : "Style #Tag"}
            </span>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {TAG_STYLES.map((ts) => (
                  <button
                    key={ts.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStickers((prev) =>
                        prev.map((s, i) => (i === selectedStickerIdx ? { ...s, styleType: ts.id } : s))
                      );
                    }}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition ${
                      (activeSticker.styleType || "pill") === ts.id
                        ? "bg-cyan-400 text-black shadow"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {ts.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStickers((prev) =>
                    prev.map((st, i) => (i === selectedStickerIdx ? { ...st, x: -160, y: -160 } : st))
                  );
                }}
                className="text-[10px] font-semibold text-white/70 hover:text-red-400 flex items-center gap-1 ml-1"
                title="Hide off screen"
              >
                <FiEyeOff size={11} /> Hide
              </button>
            </div>
          </div>
        )}

        {/* Font Carousel */}
        <div className="px-4 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 border-t border-white/10 z-30">
          {FONTS.map((f) => {
            const isFontActive = activeSticker
              ? (activeSticker.fontFamily || "sans-serif") === f.id
              : fontFamily === f.id;

            return (
              <button
                key={f.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedStickerIdx !== null) {
                    setStickers((prev) =>
                      prev.map((s, i) => (i === selectedStickerIdx ? { ...s, fontFamily: f.id } : s))
                    );
                  } else {
                    setFontFamily(f.id);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition ${
                  isFontActive ? "bg-cyan-500 text-black shadow" : "bg-white/10 text-white/60"
                }`}
                style={{ fontFamily: f.id }}
              >
                {f.name}
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="px-4 py-1.5 flex flex-col gap-1 shrink-0 z-30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider flex items-center gap-1">
              <FiDroplet size={10} className="text-cyan-400" /> Color
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc}
                  type="button"
                  onClick={() => setTextColor(tc)}
                  className={`w-5 h-5 rounded-full border shrink-0 transition-transform ${
                    textColor === tc ? "ring-2 ring-cyan-500 scale-125 shadow-md" : "border-transparent"
                  }`}
                  style={{ backgroundColor: tc }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Publish Button */}
        <div className="p-3 border-t border-white/10 shrink-0 z-30">
          <Button
            onClick={handlePost}
            loading={posting}
            className="w-full py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:opacity-95"
          >
            {isReshareMode ? "Add to your story 🚀" : `Publish Story ${privacy === "close_friends" ? "⭐" : "🚀"}`}
          </Button>
        </div>

        {showStickerDrawer && (
          <StickerDrawer
            onClose={() => setShowStickerDrawer(false)}
            onSelectSticker={(st) =>
              setStickers((prev) => [
                ...prev,
                { ...st, scale: 1, fontFamily: "sans-serif", styleType: "pill" },
              ])
            }
          />
        )}

        {showMusicModal && (
          <MusicPickerModal
            onClose={() => setShowMusicModal(false)}
            onSelectSong={(song) => setAttachedSong(song)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateStatusModal;