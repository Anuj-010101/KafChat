import { useState } from "react";
import { FiX, FiSun, FiMoon, FiImage, FiType, FiDroplet, FiRotateCcw } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

const FONTS = [
  { name: "Default (Inter)", value: "Inter, sans-serif" },
  { name: "Poppins (Modern)", value: "'Poppins', sans-serif" },
  { name: "Roboto (Clean)", value: "'Roboto', sans-serif" },
  { name: "JetBrains Mono (Code)", value: "'JetBrains Mono', monospace" },
  { name: "Playfair (Classic)", value: "'Playfair Display', serif" },
];

const PRESET_WALLPAPERS = [
  { name: "Midnight Dark", type: "color", val: "#0f1117" },
  { name: "Slate Pure", type: "color", val: "#1e293b" },
  { name: "Deep Violet", type: "color", val: "#1e1035" },
  { name: "Emerald Night", type: "color", val: "#06281e" },
  { name: "Sunset Gradient", type: "gradient", val: "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)" },
  { name: "Ocean Gradient", type: "gradient", val: "linear-gradient(135deg, #0c4a6e 0%, #042f2e 100%)" },
];

const AppearanceModal = ({ isOpen, onClose }) => {
  const { theme, setPresetDark, setPresetLight, updateCustomTheme, resetTheme } = useTheme();
  const [imageUrl, setImageUrl] = useState("");

  if (!isOpen) return null;

  const handleApplyImage = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    updateCustomTheme({ bgType: "image", bgValue: imageUrl.trim() });
    toast.success("Wallpaper image applied! 🖼️");
    setImageUrl("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-bubbleIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#181a20] border border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-black/30">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            🎨 Customize Theme & Appearance
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetTheme();
                toast.success("Reset to default dark theme");
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xs flex items-center gap-1"
              title="Reset"
            >
              <FiRotateCcw size={13} /> Reset
            </button>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-6">
          {/* 1. Default Quick Modes */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Default Modes
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPresetDark();
                  toast.success("Dark Mode activated! 🌙");
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition ${
                  theme.mode === "dark"
                    ? "bg-sky-500/20 border-sky-400 text-sky-300"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                <FiMoon size={16} /> Dark Theme (Default)
              </button>

              <button
                onClick={() => {
                  setPresetLight();
                  toast.success("Light Mode activated! ☀️");
                }}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-semibold transition ${
                  theme.mode === "light"
                    ? "bg-sky-500/20 border-sky-400 text-sky-300"
                    : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700"
                }`}
              >
                <FiSun size={16} /> Light Theme
              </button>
            </div>
          </div>

          {/* 2. Fonts Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiType /> Select Font Family
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => {
                    updateCustomTheme({ fontFamily: f.value });
                    toast.success(`Font changed to ${f.name}`);
                  }}
                  style={{ fontFamily: f.value }}
                  className={`p-2.5 rounded-xl border text-xs text-left truncate transition ${
                    theme.fontFamily === f.value
                      ? "bg-sky-500/20 border-sky-400 text-white font-bold"
                      : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Wallpaper Selection */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiImage /> Background Wallpaper
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_WALLPAPERS.map((w) => (
                <button
                  key={w.name}
                  onClick={() => updateCustomTheme({ bgType: w.type, bgValue: w.val })}
                  style={{ background: w.val }}
                  className={`h-12 rounded-xl border flex items-center justify-center text-[10px] font-semibold text-white/90 shadow-sm transition hover:scale-105 ${
                    theme.bgValue === w.val ? "ring-2 ring-sky-400 border-transparent" : "border-white/10"
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>

            {/* Custom Image URL */}
            <form onSubmit={handleApplyImage} className="mt-2 flex gap-2">
              <input
                type="url"
                placeholder="Paste wallpaper Image URL (e.g. https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-sky-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-xl transition"
              >
                Apply Image
              </button>
            </form>
          </div>

          {/* 4. Text & Accent Color Pickers */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiDroplet /> Colors & Accents
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-gray-300">Text Color</span>
                <input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => updateCustomTheme({ textColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                />
              </div>

              <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-gray-300">Accent Color</span>
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => updateCustomTheme({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceModal;