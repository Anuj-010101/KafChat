import { useState } from "react";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getBgColor = (name) => {
  const colors = [
    "bg-gradient-to-tr from-sky-500 to-indigo-500",
    "bg-gradient-to-tr from-emerald-500 to-teal-500",
    "bg-gradient-to-tr from-violet-500 to-purple-500",
    "bg-gradient-to-tr from-amber-500 to-orange-500",
    "bg-gradient-to-tr from-pink-500 to-rose-500",
    "bg-gradient-to-tr from-cyan-500 to-blue-500",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Avatar = ({ src, alt = "User", size = "md", online = false }) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl font-bold",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const showFallback = !src || imgError;

  return (
    <div className="relative inline-block shrink-0">
      {showFallback ? (
        <div
          className={`${currentSize} rounded-full ${getBgColor(
            alt
          )} text-white font-bold flex items-center justify-center shadow-inner select-none`}
        >
          {getInitials(alt)}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className={`${currentSize} rounded-full object-cover border border-gray-700/50 shadow-sm`}
        />
      )}

      {/* Online Green Dot Indicator */}
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#181a20] rounded-full" />
      )}
    </div>
  );
};

export default Avatar;