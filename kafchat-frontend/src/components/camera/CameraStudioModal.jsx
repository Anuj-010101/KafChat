import { useState, useRef, useEffect } from "react";
import {
  FiCamera,
  FiVideo,
  FiX,
  FiRefreshCw,
  FiCheck,
  FiMusic,
  FiType,
  FiSliders,
  FiAtSign,
  FiStar,
  FiClock,
  FiZap,
} from "react-icons/fi";
import api from "../../services/api";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

// Standard & PRO Exclusive Camera Filters
const CAMERA_FILTERS = [
  { id: "normal", name: "Original", css: "none", isPro: false },
  { id: "soft_glow", name: "Soft Glow ✨", css: "brightness(1.2) contrast(0.95) saturate(1.3) blur(0.4px)", isPro: false },
  { id: "golden", name: "Golden Hour 🌅", css: "sepia(0.35) saturate(1.7) brightness(1.05) contrast(1.1)", isPro: false },
  { id: "noir", name: "Noir B&W 🖤", css: "grayscale(1) contrast(1.6) brightness(0.9)", isPro: false },
  { id: "retro_90s", name: "90s Retro 📼", css: "contrast(1.35) saturate(1.5) brightness(1.1) hue-rotate(45deg)", isPro: false },
  { id: "vivid_pop", name: "Vivid Pop 🌈", css: "saturate(2.4) contrast(1.2) brightness(1.05)", isPro: false },
  { id: "aqua_chill", name: "Aqua Chill 🌊", css: "hue-rotate(160deg) saturate(1.5) contrast(1.1)", isPro: false },
  { id: "pastel_dream", name: "Pastel Dream 🌸", css: "brightness(1.18) saturate(0.85) contrast(0.95)", isPro: false },

  // 👑 PRO Exclusive Filters
  { id: "cyberpunk_8k", name: "Cyber Neon 8K ⚡ (PRO)", css: "contrast(1.55) saturate(2.6) hue-rotate(195deg) brightness(1.1)", isPro: true },
  { id: "anime_manga", name: "Anime Manga 🎨 (PRO)", css: "saturate(3.0) contrast(1.45) brightness(1.12) hue-rotate(15deg)", isPro: true },
  { id: "portrait_bokeh_pro", name: "HD Bokeh 🔍 (PRO)", css: "contrast(1.25) brightness(1.08) saturate(1.3)", isPro: true },
  { id: "hollywood_pro", name: "Hollywood Film 🎬 (PRO)", css: "contrast(1.7) brightness(0.88) saturate(1.4) sepia(0.15)", isPro: true },
  { id: "emerald_luxury", name: "Emerald Luxury 💎 (PRO)", css: "hue-rotate(95deg) saturate(1.6) contrast(1.25) brightness(1.05)", isPro: true },
];

const STICKER_PACK = ["🔥", "✨", "❤️", "🚀", "⚡", "🎉", "👑", "💯", "🍕", "😎", "🌟", "🌸"];

const CameraStudioModal = ({ isOpen, onClose, initialMode = "story" }) => {
  const { user } = useAuth();
  const isVip = Boolean(user?.isVIP);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [mode, setMode] = useState(initialMode);
  const [activeFilter, setActiveFilter] = useState("normal");
  const [facingMode, setFacingMode] = useState("user");
  const [capturedMedia, setCapturedMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showFilterPicker, setShowFilterPicker] = useState(true);

  // Timing limits: Free (45s story / 90s reel), PRO (90s story / 300s reel)
  const maxStorySeconds = isVip ? 90 : 45;
  const maxReelSeconds = isVip ? 300 : 90;
  const maxAllowedRecording = mode === "story" ? maxStorySeconds : maxReelSeconds;

  const [photoDuration, setPhotoDuration] = useState(30);

  const [customText, setCustomText] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // Privacy & Mentions
  const [privacyMode, setPrivacyMode] = useState("everyone");
  const [taggedMentions, setTaggedMentions] = useState([]);
  const [mentionSearch, setMentionSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [placedStickers, setPlacedStickers] = useState([]);

  useEffect(() => {
    if (!isOpen || capturedMedia) return;

    const startCamera = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        toast.error("Unable to access camera or microphone");
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode, capturedMedia]);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= maxAllowedRecording) {
            stopVideoRecording();
            return maxAllowedRecording;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording, maxAllowedRecording]);

  useEffect(() => {
    if (!mentionSearch.trim()) {
      setUserSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const { data } = await userService.searchUsers(mentionSearch);
        setUserSearchResults(data.users || []);
      } catch {
        setUserSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(delay);
  }, [mentionSearch]);

  if (!isOpen) return null;

  const handleSelectFilter = (filter) => {
    if (filter.isPro && !isVip) {
      toast.error("👑 PRO Filter: Upgrade to VIP to use this camera effect!");
      return;
    }
    setActiveFilter(filter.id);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 1280;
    const ctx = canvas.getContext("2d");

    const selected = CAMERA_FILTERS.find((f) => f.id === activeFilter);
    if (selected && selected.css !== "none") {
      ctx.filter = selected.css;
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ url, type: "image", blob, duration: photoDuration });
    }, "image/jpeg", 0.95);
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({
          url,
          type: "video",
          blob,
          duration: recordingSeconds || 15,
        });
        setIsRecording(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Video recording not supported on this browser");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAddMention = (userObj) => {
    if (!taggedMentions.some((m) => m._id === userObj._id)) {
      setTaggedMentions((prev) => [...prev, userObj]);
    }
    setMentionSearch("");
    setShowMentionPicker(false);
  };

  const handlePublish = async () => {
    if (!capturedMedia) return;
    try {
      setIsPosting(true);
      const formData = new FormData();
      const ext = capturedMedia.type === "video" ? "webm" : "jpg";
      formData.append("file", capturedMedia.blob, `capture_${Date.now()}.${ext}`);
      formData.append("filter", activeFilter);
      formData.append(
        "duration",
        capturedMedia.type === "image" ? photoDuration : capturedMedia.duration
      );

      const overlays = [];
      if (customText) overlays.push({ type: "text", text: customText });
      placedStickers.forEach((stk) => overlays.push({ type: "sticker", sticker: stk }));

      formData.append("overlays", JSON.stringify(overlays));
      formData.append("mentions", JSON.stringify(taggedMentions.map((u) => u._id)));
      formData.append("privacy", privacyMode);

      if (customText) formData.append("caption", customText);
      if (musicTitle) formData.append("audioTitle", musicTitle);

      if (mode === "story") {
        await api.post("/status", formData);
        toast.success(
          privacyMode === "close_friends"
            ? "Close Friends Story posted! ⭐"
            : "Story posted! 🌟"
        );
      } else {
        await api.post("/reels", formData);
        toast.success("Reel published to feed! 🎬");
      }

      setCapturedMedia(null);
      onClose();
    } catch (err) {
      console.error("Publish error:", err);
      toast.error("Failed to upload media");
    } finally {
      setIsPosting(false);
    }
  };

  const activeCss = CAMERA_FILTERS.find((f) => f.id === activeFilter)?.css || "none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none">
      <div className="relative w-full h-full max-w-md bg-black flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:border sm:border-white/10 sm:max-h-[95vh] shadow-2xl">
        {/* Top Control Bar */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
          <button
            type="button"
            onClick={() => {
              if (capturedMedia) setCapturedMedia(null);
              else onClose();
            }}
            className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition"
          >
            <FiX size={20} />
          </button>

          {!capturedMedia && (
            <div className="flex items-center gap-1 p-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              <button
                type="button"
                onClick={() => setMode("story")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  mode === "story"
                    ? "bg-cyan-500 text-black font-bold shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Story ({isVip ? "90s" : "45s"})
              </button>
              <button
                type="button"
                onClick={() => setMode("reel")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  mode === "reel"
                    ? "bg-gradient-to-r from-pink-500 to-amber-500 text-white shadow font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Reel ({isVip ? "5m" : "1.5m"})
              </button>
            </div>
          )}

          {!capturedMedia && (
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
              className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition"
              title="Switch Camera"
            >
              <FiRefreshCw size={18} />
            </button>
          )}
        </div>

        {/* Viewfinder */}
        <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {capturedMedia ? (
            capturedMedia.type === "video" ? (
              <video
                src={capturedMedia.url}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
                style={{ filter: activeCss }}
              />
            ) : (
              <img
                src={capturedMedia.url}
                alt="Captured"
                className="w-full h-full object-cover"
                style={{ filter: activeCss }}
              />
            )
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ filter: activeCss }}
            />
          )}

          {customText && (
            <div className="absolute inset-x-6 top-24 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-center text-sm font-semibold animate-bubbleIn">
              {customText}
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-3">
            {placedStickers.map((stk, i) => (
              <span key={i} className="text-4xl drop-shadow-lg animate-bounce">
                {stk}
              </span>
            ))}
          </div>

          {taggedMentions.length > 0 && (
            <div className="absolute bottom-44 left-4 z-20 flex flex-wrap gap-1.5">
              {taggedMentions.map((u) => (
                <span
                  key={u._id}
                  className="px-2.5 py-1 rounded-full bg-black/60 border border-white/30 text-[11px] font-bold text-cyan-400 backdrop-blur-md flex items-center gap-1"
                >
                  @{u.username}
                </span>
              ))}
            </div>
          )}

          {isRecording && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow animate-pulse z-30">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>
                {Math.floor(recordingSeconds / 60)}:
                {(recordingSeconds % 60).toString().padStart(2, "0")} /{" "}
                {Math.floor(maxAllowedRecording / 60)}:
                {(maxAllowedRecording % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions & Controls */}
        {capturedMedia ? (
          <div className="absolute bottom-0 inset-x-0 z-30 p-4 flex flex-col gap-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            {capturedMedia.type === "image" && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <FiClock className="text-amber-400 shrink-0" size={14} />
                <span className="text-[11px] font-bold text-white whitespace-nowrap">
                  Duration: {photoDuration}s
                </span>
                <input
                  type="range"
                  min={5}
                  max={maxStorySeconds}
                  step={1}
                  value={photoDuration}
                  onChange={(e) => setPhotoDuration(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
                <span className="text-[10px] text-gray-400 font-mono">Max {maxStorySeconds}s</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <FiType className="text-cyan-400 shrink-0" size={15} />
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Add caption..."
                  className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-400"
                />
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <FiMusic className="text-pink-400" size={14} />
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  placeholder="Song name"
                  className="w-20 bg-transparent text-xs text-white outline-none placeholder-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowMentionPicker((p) => !p)}
                className="p-2 rounded-2xl bg-white/10 text-cyan-400 backdrop-blur-md border border-white/15"
                title="Tag Friends"
              >
                <FiAtSign size={16} />
              </button>
            </div>

            {showMentionPicker && (
              <div className="p-3 rounded-2xl bg-slate-900 border border-white/20 flex flex-col gap-2 shadow-2xl animate-bubbleIn">
                <input
                  type="text"
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  placeholder="Search friends to tag..."
                  className="w-full p-2 rounded-xl bg-white/10 text-xs text-white outline-none"
                  autoFocus
                />
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-none">
                  {userSearchResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleAddMention(u)}
                      className="p-1.5 rounded-lg hover:bg-white/10 flex items-center justify-between cursor-pointer text-xs text-white"
                    >
                      <span className="font-bold">{u.fullName}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">@{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              {STICKER_PACK.map((stk, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPlacedStickers((prev) => [...prev, stk])}
                  className="text-base p-1 hover:scale-125 transition"
                >
                  {stk}
                </button>
              ))}
            </div>

            {mode === "story" && (
              <div className="flex items-center gap-2 py-0.5">
                <button
                  type="button"
                  onClick={() => setPrivacyMode("everyone")}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                    privacyMode === "everyone"
                      ? "bg-cyan-500 text-black border-transparent"
                      : "bg-white/10 text-white/80 border-white/10"
                  }`}
                >
                  Public Story
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacyMode("close_friends")}
                  className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition ${
                    privacyMode === "close_friends"
                      ? "bg-emerald-500 text-black font-bold border-transparent"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}
                >
                  <FiStar className="fill-current" size={12} /> Close Friends
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCapturedMedia(null)}
                className="px-5 py-2.5 rounded-2xl bg-white/15 text-white text-xs font-semibold backdrop-blur-md hover:bg-white/25 transition"
              >
                Retake
              </button>

              <button
                type="button"
                disabled={isPosting}
                onClick={handlePublish}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs font-black shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                {isPosting ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <FiCheck size={16} />
                    <span>
                      Share{" "}
                      {mode === "story"
                        ? privacyMode === "close_friends"
                          ? "to Close Friends ⭐"
                          : "as Story"
                        : "Reel"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 inset-x-0 z-30 p-4 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            {showFilterPicker && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                {CAMERA_FILTERS.map((filter) => {
                  const isSelected = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => handleSelectFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold shrink-0 backdrop-blur-md border transition flex items-center gap-1 ${
                        isSelected
                          ? "bg-white text-black border-white shadow-lg scale-105 font-bold"
                          : "bg-black/50 text-white/80 border-white/10 hover:bg-black/70"
                      }`}
                    >
                      <span>{filter.name}</span>
                      {filter.isPro && !isVip && (
                        <span className="px-1 py-0.2 rounded bg-amber-500 text-black text-[8px] font-black">
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-around py-2">
              <button
                type="button"
                onClick={() => setShowFilterPicker((prev) => !prev)}
                className="p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition"
                title="Filters"
              >
                <FiSliders size={20} />
              </button>

              {isRecording ? (
                <button
                  type="button"
                  onClick={stopVideoRecording}
                  className="w-18 h-18 rounded-full border-4 border-red-500 flex items-center justify-center animate-pulse"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500" />
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={takePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 bg-white/20 active:scale-90 transition"
                    title="Take Photo"
                  >
                    <div className="w-full h-full rounded-full bg-white shadow" />
                  </button>

                  <button
                    type="button"
                    onClick={startVideoRecording}
                    className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center p-1 bg-red-500/20 active:scale-90 transition"
                    title={`Record Video (Max ${maxAllowedRecording}s)`}
                  >
                    <div className="w-full h-full rounded-full bg-red-500 shadow" />
                  </button>
                </div>
              )}

              <div className="w-11" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraStudioModal;