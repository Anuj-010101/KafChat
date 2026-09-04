import { useState } from "react";
import { FiX, FiCheck, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
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
  { id: "sunset", label: "Sunset Glow", grad: "from-amber-500 to-rose-600" },
  { id: "neon", label: "Cyber Neon", grad: "from-cyan-400 to-fuchsia-600" },
  { id: "emerald", label: "Mint Forest", grad: "from-emerald-400 to-teal-800" },
  { id: "cyberpunk", label: "Gold Rush", grad: "from-yellow-400 to-amber-700" },
  { id: "darkminimal", label: "Dark Minimal", grad: "from-slate-800 to-slate-950" },
];

const DEFAULT_MALE_AVATAR = {
  gender: "male",
  skinColor: "#fcd7b8",
  hairStyle: "short-fade",
  hairColor: "#1e293b",
  glasses: "none",
  topStyle: "hoodie",
  topColor: "#0284c7",
  handPose: "wave",
  bgTheme: "neon",
};

const DEFAULT_FEMALE_AVATAR = {
  gender: "female",
  skinColor: "#fcd7b8",
  hairStyle: "long-waves",
  hairColor: "#451a03",
  glasses: "none",
  topStyle: "jacket",
  topColor: "#db2777",
  handPose: "peace",
  bgTheme: "sunset",
};

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

  const activeThemeGrad = THEMES.find((t) => t.id === avatarConfig.bgTheme)?.grad || "from-slate-800 to-slate-950";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-[#0d131f] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-bubbleIn">
        {/* Left Live Canvas Preview */}
        <div className="w-full md:w-5/12 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-[#121929]/40">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Snap 3D Studio
            </span>
            <button
              onClick={() =>
                setAvatarConfig(
                  avatarConfig.gender === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR
                )
              }
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              title="Reset Default"
            >
              <FiRefreshCw size={14} />
            </button>
          </div>

          {/* Render Vector Avatar Container */}
          <div className={`w-44 h-56 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 my-auto bg-gradient-to-tr ${activeThemeGrad} flex flex-col items-center justify-center relative`}>
            {/* Dynamic Scalable Avatar Vector Head */}
            <div
              className="w-20 h-24 rounded-full border-2 border-black/20 shadow-lg relative flex flex-col items-center justify-center"
              style={{ backgroundColor: avatarConfig.skinColor }}
            >
              {/* Hair Cap */}
              <div
                className="absolute -top-2 inset-x-0 h-8 rounded-t-full"
                style={{ backgroundColor: avatarConfig.hairColor }}
              />

              {/* Eyes */}
              <div className="flex items-center gap-4 mt-2">
                <div className="w-2 h-2 rounded-full bg-slate-900" />
                <div className="w-2 h-2 rounded-full bg-slate-900" />
              </div>

              {/* Eyewear */}
              {avatarConfig.glasses !== "none" && (
                <div
                  className={`absolute top-7 w-16 h-4 border-2 ${
                    avatarConfig.glasses === "sun" ? "bg-black border-black" : "border-slate-800"
                  } rounded-full`}
                />
              )}

              {/* Smile */}
              <div className="w-4 h-2 border-b-2 border-slate-900 rounded-full mt-2" />
            </div>

            {/* Avatar Torso */}
            <div
              className="w-28 h-16 rounded-t-3xl mt-1 shadow-md flex items-center justify-center"
              style={{ backgroundColor: avatarConfig.topColor }}
            >
              <span className="text-xs font-bold text-white/80 uppercase">
                {avatarConfig.topStyle}
              </span>
            </div>

            {/* Floating Pose Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-md">
              {avatarConfig.handPose === "wave" ? "👋 Wave" : avatarConfig.handPose === "peace" ? "✌️ Peace" : "😎 Pocket"}
            </div>
          </div>

          <div className="flex gap-2 w-full mt-2">
            <button
              onClick={() => handleGenderSwitch("male")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                avatarConfig.gender === "male"
                  ? "bg-cyan-400 text-black font-bold shadow"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Men Preset
            </button>
            <button
              onClick={() => handleGenderSwitch("female")}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                avatarConfig.gender === "female"
                  ? "bg-pink-500 text-white font-bold shadow"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Women Preset
            </button>
          </div>
        </div>

        {/* Right Customization Controls */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Customize Components</h3>
            <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white">
              <FiX size={18} />
            </button>
          </div>

          <div className="flex border-b border-slate-800 px-4 pt-2 overflow-x-auto scrollbar-none gap-2 text-xs font-semibold">
            {["body", "clothes", "pose", "theme"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-2 capitalize transition border-b-2 ${
                  activeTab === tab
                    ? "border-cyan-400 text-cyan-400 font-bold"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto scrollbar-thin flex-1 flex flex-col gap-4 text-xs">
            {activeTab === "body" && (
              <>
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-slate-300">Skin Complexion</span>
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
                  <span className="font-semibold text-slate-300">Hair Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {HAIR_STYLES.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => update("hairStyle", h.id)}
                        className={`p-2.5 rounded-xl border text-left font-medium transition ${
                          avatarConfig.hairStyle === h.id ? "border-cyan-400 bg-cyan-950/40 text-cyan-300" : "border-slate-800 bg-slate-900 text-slate-300"
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-slate-300">Hair Dye Color</span>
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
                  <span className="font-semibold text-slate-300">Glasses / Eyewear</span>
                  <div className="grid grid-cols-3 gap-2">
                    {GLASSES.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => update("glasses", g.id)}
                        className={`p-2 rounded-xl border font-medium text-center transition ${
                          avatarConfig.glasses === g.id ? "border-cyan-400 bg-cyan-950/40 text-cyan-300" : "border-slate-800 bg-slate-900 text-slate-300"
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
                  <span className="font-semibold text-slate-300">Outfit Style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "hoodie", label: "Casual Hoodie" },
                      { id: "jacket", label: "Smart Jacket" },
                    ].map((top) => (
                      <button
                        key={top.id}
                        onClick={() => update("topStyle", top.id)}
                        className={`p-2.5 rounded-xl border font-medium text-left transition ${
                          avatarConfig.topStyle === top.id ? "border-cyan-400 bg-cyan-950/40 text-cyan-300" : "border-slate-800 bg-slate-900 text-slate-300"
                        }`}
                      >
                        {top.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-slate-300">Top Outfit Color</span>
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
                <span className="font-semibold text-slate-300">Hand Pose & Gesture</span>
                <div className="grid grid-cols-1 gap-2">
                  {POSES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => update("handPose", p.id)}
                      className={`p-3 rounded-2xl border font-semibold text-left flex items-center justify-between transition ${
                        avatarConfig.handPose === p.id ? "border-cyan-400 bg-cyan-950/40 text-cyan-300" : "border-slate-800 bg-slate-900 text-slate-300"
                      }`}
                    >
                      <span>{p.label}</span>
                      {avatarConfig.handPose === p.id && <FiCheck className="text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "theme" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-300">Backdrop Gradient Card</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => update("bgTheme", th.id)}
                      className={`p-3 rounded-2xl border text-left font-semibold transition ${
                        avatarConfig.bgTheme === th.id ? "border-cyan-400 bg-cyan-950/40 text-cyan-300" : "border-slate-800 bg-slate-900 text-slate-300"
                      }`}
                    >
                      {th.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-[#121929]/30 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-xs shadow-lg hover:opacity-95 transition"
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