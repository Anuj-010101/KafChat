import { useState } from "react";
import {
  FiX,
  FiSun,
  FiMoon,
  FiCheck,
  FiType,
  FiDroplet,
  FiSliders,
  FiImage,
} from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

const COLOR_PRESETS = [
  { name: "Ocean Sky", accent: "#0284c7" },
  { name: "Emerald Mint", accent: "#10b981" },
  { name: "Purple Neon", accent: "#8b5cf6" },
  { name: "Rose Pink", accent: "#f43f5e" },
  { name: "Amber Gold", accent: "#f59e0b" },
  { name: "Signal Blue", accent: "#38bdf8" },
];

const FONTS = [
  { name: "Inter (Modern)", family: "'Inter', sans-serif" },
  { name: "Poppins (Clean)", family: "'Poppins', sans-serif" },
  { name: "Roboto (Classic)", family: "'Roboto', sans-serif" },
  { name: "Playfair (Elegant)", family: "'Playfair Display', serif" },
  { name: "JetBrains (Tech)", family: "'JetBrains Mono', monospace" },
];

const WALLPAPERS = [
  { name: "None", url: "" },
  {
    name: "Subtle Geometric",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Dark Mesh",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Cosmic Nebula",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop",
  },
];

const ThemeModal = ({ onClose }) => {
  const { theme, setPresetDark, setPresetLight, updateCustomTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("mode");

  const handleSelectAccent = (colorHex) => {
    updateCustomTheme({ accentColor: colorHex });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn select-none">
      {/* Main Container */}
      <div
        className="w-full sm:max-w-lg theme-panel-bg border-t sm:border theme-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-bubbleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b theme-border theme-soft-bg/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg theme-accent-tint flex items-center justify-center">
              <FiSliders size={16} />
            </div>
            <h2 className="text-sm sm:text-base font-bold theme-text tracking-wide">
              Customize Theme & Appearance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="theme-text-muted hover:theme-text p-1.5 rounded-xl hover:theme-soft-bg transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 px-5 sm:px-6 pt-3.5 pb-2.5 border-b theme-border theme-panel-bg overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("mode")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "mode"
                ? "theme-accent-bg shadow-md"
                : "theme-text-muted hover:theme-text hover:theme-soft-bg"
            }`}
          >
            <FiSun size={13} /> Appearance Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("colors")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "colors"
                ? "theme-accent-bg shadow-md"
                : "theme-text-muted hover:theme-text hover:theme-soft-bg"
            }`}
          >
            <FiDroplet size={13} /> Accent Colors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("font")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "font"
                ? "theme-accent-bg shadow-md"
                : "theme-text-muted hover:theme-text hover:theme-soft-bg"
            }`}
          >
            <FiType size={13} /> Font Style
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallpaper")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === "wallpaper"
                ? "theme-accent-bg shadow-md"
                : "theme-text-muted hover:theme-text hover:theme-soft-bg"
            }`}
          >
            <FiImage size={13} /> Chat Wallpaper
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto scrollbar-thin flex-1 flex flex-col gap-5">
          {/* TAB 1: BASE MODE */}
          {activeTab === "mode" && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold theme-text-muted uppercase tracking-wider">
                Select Base Mode
              </span>

              <div className="grid grid-cols-2 gap-3.5">
                <div
                  onClick={setPresetLight}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center ${
                    theme.mode === "light"
                      ? "theme-accent-border theme-accent-tint shadow-lg"
                      : "theme-border theme-soft-bg/50 hover:theme-soft-bg"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <FiSun size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold theme-text">Light Mode</h4>
                    <p className="text-[11px] theme-text-muted mt-0.5">
                      Clean & crisp daylight look
                    </p>
                  </div>
                  {theme.mode === "light" && (
                    <span className="px-2 py-0.5 theme-accent-bg text-[10px] font-bold rounded-full flex items-center gap-1">
                      <FiCheck size={11} /> Active
                    </span>
                  )}
                </div>

                <div
                  onClick={setPresetDark}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center ${
                    theme.mode === "dark"
                      ? "theme-accent-border theme-accent-tint shadow-lg"
                      : "theme-border theme-soft-bg/50 hover:theme-soft-bg"
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <FiMoon size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold theme-text">Dark Mode</h4>
                    <p className="text-[11px] theme-text-muted mt-0.5">
                      Sleek & comfortable for eyes
                    </p>
                  </div>
                  {theme.mode === "dark" && (
                    <span className="px-2 py-0.5 theme-accent-bg text-[10px] font-bold rounded-full flex items-center gap-1">
                      <FiCheck size={11} /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCENT COLORS */}
          {activeTab === "colors" && (
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-bold theme-text-muted uppercase tracking-wider">
                Select Brand Accent Color
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = theme.accentColor === preset.accent;
                  return (
                    <div
                      key={preset.name}
                      onClick={() => handleSelectAccent(preset.accent)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? "theme-accent-border theme-soft-bg shadow"
                          : "theme-border theme-soft-bg/40 hover:theme-soft-bg"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full shadow-inner border border-black/10"
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span className="text-xs font-semibold theme-text">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <FiCheck className="theme-accent-text font-bold" size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FONT SELECTION */}
          {activeTab === "font" && (
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-bold theme-text-muted uppercase tracking-wider">
                Choose Typography
              </span>

              <div className="flex flex-col gap-2">
                {FONTS.map((f) => {
                  const isSelected = theme.fontFamily === f.family;
                  return (
                    <div
                      key={f.name}
                      onClick={() => updateCustomTheme({ fontFamily: f.family })}
                      className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? "theme-accent-border theme-soft-bg shadow"
                          : "theme-border theme-soft-bg/40 hover:theme-soft-bg"
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold theme-text">
                          {f.name}
                        </span>
                        <span className="text-[11px] theme-text-muted">
                          The quick brown fox jumps over the lazy dog.
                        </span>
                      </div>
                      {isSelected && (
                        <FiCheck className="theme-accent-text shrink-0" size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: WALLPAPER */}
          {activeTab === "wallpaper" && (
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-bold theme-text-muted uppercase tracking-wider">
                Select Background Wallpaper
              </span>

              <div className="grid grid-cols-2 gap-3">
                {WALLPAPERS.map((w) => {
                  const isSelected =
                    (w.url === "" && theme.bgType === "color") ||
                    (theme.bgType === "image" && theme.bgValue === w.url);

                  return (
                    <div
                      key={w.name}
                      onClick={() => {
                        if (w.url === "") {
                          updateCustomTheme({
                            bgType: "color",
                            bgValue: theme.mode === "light" ? "#f8fafc" : "#0b0e14",
                          });
                        } else {
                          updateCustomTheme({
                            bgType: "image",
                            bgValue: w.url,
                          });
                        }
                      }}
                      className={`relative h-28 rounded-2xl border-2 cursor-pointer overflow-hidden flex flex-col justify-end p-2.5 transition-all ${
                        isSelected
                          ? "theme-accent-border ring-2 ring-sky-500/20"
                          : "theme-border"
                      }`}
                      style={{
                        backgroundImage: w.url ? `url('${w.url}')` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: w.url ? "transparent" : "var(--app-soft-bg)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white truncate">
                          {w.name}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full theme-accent-bg flex items-center justify-center">
                            <FiCheck size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t theme-border theme-soft-bg/30 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl theme-accent-bg text-xs font-semibold transition shadow-lg text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;