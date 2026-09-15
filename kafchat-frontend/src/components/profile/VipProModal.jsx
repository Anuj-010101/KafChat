import React, { useState } from "react";
import {
  FiX,
  FiAward,
  FiCheckCircle,
  FiEyeOff,
  FiShield,
  FiImage,
  FiType,
  FiClock,
  FiTrash2,
  FiZap,
  FiVideo,
  FiSliders,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import toast from "react-hot-toast";

const VipProModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isVip = Boolean(user?.isVIP);
  const [loading, setLoading] = useState(false);

  const [ghostMode, setGhostMode] = useState(Boolean(user?.isGhostModeActive));
  const [screenshotAlert, setScreenshotAlert] = useState(true);

  if (!isOpen) return null;

  const handleToggleFeature = async (featureKey, currentValue, setter) => {
    try {
      setLoading(true);
      const nextVal = !currentValue;
      setter(nextVal);
      await api.patch("/users/profile", { [featureKey]: nextVal });
      toast.success("Preference updated!");
    } catch (err) {
      setter(currentValue);
      toast.error("Failed to update preference");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeVip = () => {
    toast.success("Opening VIP PRO subscription plans...");
  };

  const vipFeaturesList = [
    {
      icon: <FiSliders className="text-purple-400" size={18} />,
      title: "Custom Themes & Luxury Fonts",
      desc: "Unlock neon/aurora color palettes and luxury serif/mono typography.",
      status: isVip ? "Unlocked" : "VIP Only",
    },
    {
      icon: <FiImage className="text-pink-400" size={18} />,
      title: "Multi-DP Gallery (Up to 5 Photos)",
      desc: "Switch between up to 5 profile photos with HD preview support.",
      status: isVip ? "Active (5 DPs)" : "VIP Only",
    },
    {
      icon: <FiVideo className="text-sky-400" size={18} />,
      title: "Extended Reels & Story Timings",
      desc: "Upload longer video stories and extended duration high-FPS Reels.",
      status: isVip ? "Unlocked (3m limit)" : "VIP Only",
    },
    {
      icon: <FiEyeOff className="text-cyan-400" size={18} />,
      title: "Ghost Mode (Hide Online & Seen Ticks)",
      desc: "Hide green status, timestamp, and read receipts in chats.",
      status: isVip ? "Active" : "VIP Only",
      isToggle: isVip,
      toggleValue: ghostMode,
      onToggle: () => handleToggleFeature("isGhostModeActive", ghostMode, setGhostMode),
    },
    {
      icon: <FiShield className="text-amber-400" size={18} />,
      title: "Screenshot & Screen Recording Protection",
      desc: "Instant notification alerts and extra privacy controls for chat captures.",
      status: isVip ? "Active" : "VIP Only",
      isToggle: isVip,
      toggleValue: screenshotAlert,
      onToggle: () => setScreenshotAlert(!screenshotAlert),
    },
    {
      icon: <FiTrash2 className="text-red-400" size={18} />,
      title: "Deleted Messages Access",
      desc: "Read incoming chat messages even after 'Delete for everyone'.",
      status: isVip ? "Active" : "VIP Only",
    },
    {
      icon: <FiAward className="text-amber-500" size={18} />,
      title: "VIP PRO Golden Badge",
      desc: "Showcase an exclusive PRO badge next to your username.",
      status: isVip ? "Active" : "VIP Only",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg theme-panel-bg border theme-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-bubbleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border-b theme-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-500 flex items-center justify-center text-black shadow-lg">
              <FiAward size={20} className="fill-black" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight theme-text flex items-center gap-1.5">
                {isVip ? "VIP PRO Suite Active" : "KafChat VIP PRO Membership"}
                {isVip && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black">
                    PRO
                  </span>
                )}
              </h2>
              <p className="text-[11px] theme-text-muted">
                {isVip
                  ? "All luxury themes, Ghost Mode, and multi-DP perks are active"
                  : "Unlock themes, fonts, Ghost Mode, 5 DPs & anti-delete features"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full theme-soft-bg theme-text-muted hover:theme-text transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Features Scrollable Body */}
        <div className="p-5 overflow-y-auto scrollbar-thin flex flex-col gap-2.5">
          {vipFeaturesList.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-3 hover:theme-accent-tint transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl theme-panel-bg border theme-border shrink-0">
                  {item.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold theme-text">{item.title}</span>
                  <span className="text-[11px] theme-text-muted leading-tight mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                {item.isToggle ? (
                  <input
                    type="checkbox"
                    checked={item.toggleValue}
                    onChange={item.onToggle}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                ) : (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isVip
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "theme-soft-bg theme-text-muted border theme-border"
                    }`}
                  >
                    {item.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="p-4 theme-soft-bg/60 border-t theme-border flex items-center justify-between gap-3">
          {isVip ? (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <FiCheckCircle size={15} /> VIP PRO Perks Enabled
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUpgradeVip}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 text-white text-xs font-black shadow-lg hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <FiZap size={15} /> Upgrade to VIP PRO Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VipProModal;