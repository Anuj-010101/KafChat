import { useState } from "react";
import { FiX, FiCheck, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import { RenderSnapAvatar, DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR } from "./AvatarBuilder";
import toast from "react-hot-toast";

const HAIR_STYLES = [
  { id: "short-fade", label: "Short Fade" },
  { id: "spiky", label: "Cool Spiky" },
  { id: "long-waves", label: "Long Wavy" },
  { id: "ponytail", label: "High Ponytail" },
];

const POSES = [
  { id: "wave", label: "👋 Hello Wave" },
  { id: "peace", label: "✌️ Peace / Victory" },
  { id: "pocket", label: "😎 Cool Pocket" },
];

const GLASSES = [
  { id: "none", label: "None" },
  { id: "round", label: "Round Frames" },
  { id: "sun", label: "Dark Shades" },
];

const SKIN_TONES = ["#fcd7b8", "#f5d0b5", "#d4a373", "#a9714b", "#6f4427"];
const HAIR_COLORS = ["#1e293b", "#451a03", "#78350f", "#f59e0b", "#9333ea"];
const TOP_COLORS = ["#0284c7", "#db2777", "#10b981", "#7c3aed", "#ea580c", "#0f172a"];

const THEMES = [
  { id: "sunset", label: "Sunset Glow" },
  { id: "neon", label: "Cyber Neon" },
  { id: "emerald", label: "Mint Forest" },
  { id: "cyberpunk", label: "Gold Rush" },
  { id: "darkminimal", label: "Dark Minimal" },
];

const AvatarStudioModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const initialConfig =
    user?.avatarConfig && Object.keys(user.avatarConfig).length > 0
      ? user.avatarConfig
      : user?.gender === "Female"
      ? DEFAULT_FEMALE_AVATAR
      : DEFAULT_MALE_AVATAR;

  const [avatarConfig, setAvatarConfig] = useState(initialConfig);
  const [activeTab, setActiveTab] = useState("body");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const update = (key, value) => {
    setAvatarConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenderSwitch = (g) => {
    setAvatarConfig(g === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ avatarConfig });
      toast.success("3D Snap Avatar & Backdrop Saved! 🎉");
      onClose();
    } catch {
      toast.error("Failed to save avatar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-fadeIn select-none">
      {/* Modal Container with strict height bounds for mobile */}
      <div className="w-full max-w-2xl theme-panel-bg border theme-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[92vh] max-h-[92vh] animate-bubbleIn">
        
        {/* Left Live Canvas Preview */}
        <div className="w-full md:w-5/12 p-4 sm:p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r theme-border theme-soft-bg/40 shrink-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold theme-text uppercase tracking-wider">
              Snap 3D Studio
            </span>
            <button
              onClick={() =>
                setAvatarConfig(
                  avatarConfig.gender === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR
                )
              }
              className="p-1 rounded-lg theme-text-muted hover:theme-text"
              title="Reset Default"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>

          {/* Render Vector Avatar Canvas */}
          <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 my-auto relative">
            <RenderSnapAvatar config={avatarConfig} />
          </div>

          <div className="flex gap-2 w-full mt-2">
            <button
              onClick={() => handleGenderSwitch("male")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                avatarConfig.gender === "male"
                  ? "theme-accent-bg text-white font-bold shadow"
                  : "theme-soft-bg theme-text-muted hover:theme-text"
              }`}
            >
              Men Preset
            </button>
            <button
              onClick={() => handleGenderSwitch("female")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                avatarConfig.gender === "female"
                  ? "theme-accent-bg text-white font-bold shadow"
                  : "theme-soft-bg theme-text-muted hover:theme-text"
              }`}
            >
              Women Preset
            </button>
          </div>
        </div>

        {/* Right Customization Controls with min-h-0 and proper scroll */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="h-14 px-6 border-b theme-border flex items-center justify-between shrink-0">
            <h3 className="text-sm font-bold theme-text">Customize Components</h3>
            <button onClick={onClose} className="p-1 rounded-xl theme-text-muted hover:theme-text">
              <FiX size={18} />
            </button>
          </div>

          <div className="flex border-b theme-border px-4 pt-2 overflow-x-auto scrollbar-none gap-2 text-xs font-semibold shrink-0">
            {["body", "clothes", "pose", "theme"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-2 capitalize transition border-b-2 ${
                  activeTab === tab
                    ? "theme-accent-border theme-accent-text font-bold"
                    : "border-transparent theme-text-muted hover:theme-text"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable Options Area with generous bottom padding */}
          <div className="p-4 sm:p-6 pb-32 overflow-y-auto scrollbar-thin flex-1 min-h-0 flex flex-col gap-4 text-xs">
            {activeTab === "body" && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold theme-text">Skin Complexion</span>
                  <div className="flex gap-2">
                    {SKIN_TONES.map((color) => (
                      <button
                        key={color}
                        onClick={() => update("skinColor", color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          avatarConfig.skinColor === color ? "scale-125 border-white shadow" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold theme-text">Hair Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => update("hairStyle", h.id)}
                        className={`p-2.5 rounded-xl border text-left font-medium transition ${
                          avatarConfig.hairStyle === h.id ? "theme-accent-border theme-accent-tint theme-accent-text" : "theme-border theme-soft-bg theme-text"
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold theme-text">Hair Dye Color</span>
                  <div className="flex gap-2">
                    {HAIR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => update("hairColor", color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          avatarConfig.hairColor === color ? "scale-125 border-white shadow" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold theme-text">Glasses / Eyewear</span>
                  <div className="grid grid-cols-3 gap-2">
                    {GLASSES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => update("glasses", g.id)}
                        className={`p-2 rounded-xl border font-medium text-center transition ${
                          avatarConfig.glasses === g.id ? "theme-accent-border theme-accent-tint theme-accent-text" : "theme-border theme-soft-bg theme-text"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "clothes" && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold theme-text">Outfit Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "hoodie", label: "Casual Hoodie" },
                      { id: "jacket", label: "Smart Jacket" },
                    ].map((top) => (
                      <button
                        key={top.id}
                        onClick={() => update("topStyle", top.id)}
                        className={`p-2.5 rounded-xl border font-medium text-left transition ${
                          avatarConfig.topStyle === top.id ? "theme-accent-border theme-accent-tint theme-accent-text" : "theme-border theme-soft-bg theme-text"
                        }`}
                      >
                        {top.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold theme-text">Top Outfit Color</span>
                  <div className="flex gap-2">
                    {TOP_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => update("topColor", color)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          avatarConfig.topColor === color ? "scale-125 border-white shadow" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "pose" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold theme-text">Hand Pose & Gesture</span>
                <div className="grid grid-cols-1 gap-2">
                  {POSES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => update("handPose", p.id)}
                      className={`p-3 rounded-2xl border font-semibold text-left flex items-center justify-between transition ${
                        avatarConfig.handPose === p.id ? "theme-accent-border theme-accent-tint theme-accent-text" : "theme-border theme-soft-bg theme-text"
                      }`}
                    >
                      <span>{p.label}</span>
                      {avatarConfig.handPose === p.id && <FiCheck className="theme-accent-text" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold theme-text">Backdrop Gradient Card</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => update("bgTheme", th.id)}
                      className={`p-3 rounded-2xl border text-left font-semibold transition ${
                        avatarConfig.bgTheme === th.id ? "theme-accent-border theme-accent-tint theme-accent-text" : "theme-border theme-soft-bg theme-text"
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t theme-border theme-soft-bg/30 flex justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold theme-text-muted hover:theme-text"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl theme-accent-bg text-white font-black text-xs shadow-lg hover:opacity-95 transition"
            >
              {saving ? "Saving..." : "Save Avatar & Backdrop"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarStudioModal;