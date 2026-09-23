import {
  RenderSnapAvatar,
  DEFAULT_MALE_AVATAR,
  DEFAULT_FEMALE_AVATAR,
} from "../avatar/AvatarBuilder";
import { FiCamera } from "react-icons/fi";

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  return name.trim().charAt(0).toUpperCase() || "U";
};

const getMonogramColor = (name) => {
  const safeName = name || "User";
  const colors = ["#0284c7", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#ca8a04"];
  return colors[safeName.length % colors.length];
};

const DualProfileBanner = ({ user, isSelf, onEditAvatar, onChangeDp, onViewFullDp }) => {
  if (!user) return null;

  const avatarConfig =
    user?.avatarConfig && Object.keys(user.avatarConfig).length > 0
      ? user.avatarConfig
      : user?.gender === "Female"
      ? DEFAULT_FEMALE_AVATAR
      : DEFAULT_MALE_AVATAR;

  const displayName = user?.fullName || user?.username || "User";
  const initial = getInitials(displayName);
  const monogramBg = getMonogramColor(displayName);

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* 1. BACKGROUND SNAP AVATAR CANVAS */}
      <div className="relative w-full h-40 sm:h-48 rounded-2xl sm:rounded-3xl overflow-hidden border theme-border shadow-md group">
        <RenderSnapAvatar config={avatarConfig} />

        {/* Edit Snap Avatar Button */}
        {isSelf && onEditAvatar && (
          <button
            type="button"
            onClick={onEditAvatar}
            className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg border border-white/20 transition opacity-90 sm:opacity-0 group-hover:opacity-100"
          >
            🎨 Edit Avatar
          </button>
        )}
      </div>

      {/* 2. FRONT CIRCULAR DP (Photo OR WhatsApp Monogram) */}
      <div className="relative -mt-12 sm:-mt-14 z-10 flex flex-col items-center">
        <div
          onClick={isSelf ? onChangeDp : onViewFullDp}
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 theme-panel-bg shadow-2xl cursor-pointer group"
          title={isSelf ? "Click to change photo" : "Click to view full photo"}
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="w-full h-full object-cover rounded-full border-2 border-white/20"
            />
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-inner border-2 border-white/30"
              style={{ backgroundColor: monogramBg }}
            >
              {initial}
            </div>
          )}

          {/* Camera Overlay for Self */}
          {isSelf && (
            <div className="absolute inset-1 bg-black/50 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <FiCamera size={18} />
              <span className="text-[9px] mt-0.5 font-semibold">Change</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DualProfileBanner;