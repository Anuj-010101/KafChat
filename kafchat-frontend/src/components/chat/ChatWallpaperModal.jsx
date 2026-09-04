import { useState, useRef, useEffect } from "react";
import { FiX, FiImage, FiCheck, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

const PRESET_WALLPAPERS = [
  { id: "default", name: "Default Theme", bg: "" },
  { id: "dark_slate", name: "Dark Slate", bg: "#0f172a" },
  { id: "midnight", name: "Midnight Blue", bg: "linear-gradient(to bottom, #020617, #0f172a)" },
  { id: "sunset", name: "Sunset Glow", bg: "linear-gradient(to bottom, #1e1b4b, #311042)" },
  { id: "emerald_dark", name: "Emerald Forest", bg: "linear-gradient(to bottom, #064e3b, #022c22)" },
  { id: "doodle", name: "Dark Nebula", bg: "linear-gradient(to bottom, #18181b, #27272a)" },
];

const ChatWallpaperModal = ({ isOpen, onClose, chatId }) => {
  const fileInputRef = useRef(null);
  const storageKey = `chat_wallpaper_${chatId}`;
  const [selectedWallpaper, setSelectedWallpaper] = useState("");

  useEffect(() => {
    if (chatId) {
      setSelectedWallpaper(localStorage.getItem(storageKey) || "");
    }
  }, [chatId, storageKey, isOpen]);

  if (!isOpen) return null;

  const applyWallpaper = (wallpaperValue) => {
    setSelectedWallpaper(wallpaperValue);
    if (wallpaperValue) {
      localStorage.setItem(storageKey, wallpaperValue);
      // Trigger global event taaki ChatWindow bina reload ke instant update ho
      window.dispatchEvent(new CustomEvent("wallpaper_updated", { detail: { chatId, wallpaper: wallpaperValue } }));
      toast.success("Chat wallpaper applied! 🎨");
    } else {
      localStorage.removeItem(storageKey);
      window.dispatchEvent(new CustomEvent("wallpaper_updated", { detail: { chatId, wallpaper: "" } }));
      toast.success("Wallpaper reset to default");
    }
  };

  const handleCustomUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      applyWallpaper(`url(${reader.result})`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl animate-bubbleIn flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <h4 className="text-sm font-bold theme-text flex items-center gap-2">
            <FiImage className="theme-accent-text" /> Chat Wallpaper
          </h4>
          <button type="button" onClick={onClose} className="theme-text-muted hover:theme-text">
            <FiX size={18} />
          </button>
        </div>

        <p className="text-xs theme-text-muted">
          Set a custom background wallpaper for this conversation.
        </p>

        {/* Gallery Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleCustomUpload}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 rounded-2xl theme-soft-bg border theme-border hover:theme-accent-border text-xs font-semibold theme-text flex items-center justify-center gap-2 transition"
        >
          <FiImage size={15} className="theme-accent-text" /> Choose from Gallery / Phone
        </button>

        {/* Preset Wallpapers */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold theme-text-muted">Preset Wallpapers</span>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_WALLPAPERS.map((preset) => {
              const isActive = selectedWallpaper === preset.bg;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyWallpaper(preset.bg)}
                  className="h-16 rounded-2xl border theme-border flex flex-col items-center justify-center relative overflow-hidden transition hover:scale-105"
                  style={{ background: preset.bg || "#1e293b" }}
                >
                  <span className="text-[10px] font-semibold text-white drop-shadow px-1 text-center">
                    {preset.name}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full theme-accent-bg text-white flex items-center justify-center text-[10px]">
                      <FiCheck size={10} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset */}
        {selectedWallpaper && (
          <button
            type="button"
            onClick={() => applyWallpaper("")}
            className="w-full py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <FiTrash2 size={13} /> Reset to Default Wallpaper
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl theme-accent-bg text-white text-xs font-semibold shadow transition hover:opacity-95"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default ChatWallpaperModal;