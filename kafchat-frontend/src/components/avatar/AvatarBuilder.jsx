export const DEFAULT_MALE_AVATAR = {
  gender: "male",
  skinColor: "#f5d0b5",
  hairStyle: "short-fade",
  hairColor: "#1e293b",
  topStyle: "hoodie",
  topColor: "#0284c7",
  pantStyle: "jeans",
  pantColor: "#1e293b",
  shoesStyle: "sneakers",
  shoesColor: "#f8fafc",
  handPose: "wave",
  expression: "smile",
  glasses: "none",
  bgTheme: "sunset",
};

export const DEFAULT_FEMALE_AVATAR = {
  gender: "female",
  skinColor: "#fcd7b8",
  hairStyle: "long-waves",
  hairColor: "#451a03",
  topStyle: "jacket",
  topColor: "#db2777",
  pantStyle: "jeans",
  pantColor: "#0f172a",
  shoesStyle: "sneakers",
  shoesColor: "#334155",
  handPose: "peace",
  expression: "smile",
  glasses: "none",
  bgTheme: "neon",
};

export const RenderSnapAvatar = ({ config }) => {
  const baseDefault = config?.gender === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR;
  const c = {
    ...baseDefault,
    ...(config || {}),
  };

  const bgGradients = {
    sunset: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
    neon: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #9333ea 100%)",
    emerald: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
    cyberpunk: "linear-gradient(135deg, #f43f5e 0%, #f59e0b 50%, #10b981 100%)",
    darkminimal: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
  };

  const currentBg = bgGradients[c.bgTheme] || bgGradients.sunset;
  const skinColor = c.skinColor || "#f5d0b5";
  const hairColor = c.hairColor || "#1e293b";
  const topColor = c.topColor || "#0284c7";
  const pantColor = c.pantColor || "#1e293b";
  const shoesColor = c.shoesColor || "#f8fafc";

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
      style={{ background: currentBg }}
    >
      <svg
        viewBox="0 0 240 320"
        className="w-full h-full drop-shadow-2xl transition-all duration-300 pointer-events-none"
      >
        <circle cx="120" cy="120" r="85" fill="rgba(255,255,255,0.15)" />

        {/* Legs & Pants */}
        <g id="legs">
          <rect x="95" y="195" width="20" height="75" rx="8" fill={pantColor} />
          <rect x="125" y="195" width="20" height="75" rx="8" fill={pantColor} />
        </g>

        {/* Shoes */}
        <g id="shoes">
          {c.shoesStyle === "sneakers" ? (
            <>
              <path d="M 88 265 L 117 265 C 117 275, 80 275, 88 265 Z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="2" />
              <path d="M 123 265 L 152 265 C 152 275, 115 275, 123 265 Z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="2" />
            </>
          ) : (
            <>
              <rect x="92" y="260" width="24" height="15" rx="4" fill={shoesColor} />
              <rect x="124" y="260" width="24" height="15" rx="4" fill={shoesColor} />
            </>
          )}
        </g>

        {/* Torso */}
        <g id="torso">
          <path
            d="M 85 118 Q 120 128 155 118 L 150 200 L 90 200 Z"
            fill={topColor}
          />
          {c.topStyle === "hoodie" ? (
            <path d="M 95 118 Q 120 140 145 118" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="6" />
          ) : (
            <polygon points="120,135 105,118 135,118" fill="#ffffff" opacity="0.3" />
          )}
        </g>

        {/* Arms & Pose */}
        <g id="arms">
          {c.handPose === "wave" && (
            <>
              <path d="M 85 125 Q 70 160 80 185" fill="none" stroke={topColor} strokeWidth="16" strokeLinecap="round" />
              <circle cx="80" cy="188" r="8" fill={skinColor} />

              <path d="M 155 125 Q 185 100 178 70" fill="none" stroke={topColor} strokeWidth="16" strokeLinecap="round" />
              <circle cx="178" cy="65" r="9" fill={skinColor} />
              <path d="M 175 60 L 175 52 M 180 60 L 182 52 M 185 62 L 190 56" stroke={skinColor} strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {c.handPose === "peace" && (
            <>
              <path d="M 85 125 Q 70 160 80 185" fill="none" stroke={topColor} strokeWidth="16" strokeLinecap="round" />
              <circle cx="80" cy="188" r="8" fill={skinColor} />

              <path d="M 155 125 Q 180 135 170 95" fill="none" stroke={topColor} strokeWidth="16" strokeLinecap="round" />
              <circle cx="170" cy="90" r="9" fill={skinColor} />
              <path d="M 166 85 L 163 72 M 172 85 L 176 72" stroke={skinColor} strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}

          {c.handPose === "pocket" && (
            <>
              <path d="M 85 125 Q 68 155 92 185" fill="none" stroke={topColor} strokeWidth="16" strokeLinecap="round" />
              <path d="M 155 125 Q 172 155 148 185" fill="none" stroke={topColor} strokeWidth="16" strokeLinecap="round" />
            </>
          )}
        </g>

        {/* Head */}
        <rect x="112" y="105" width="16" height="20" fill={skinColor} />
        <ellipse cx="120" cy="78" rx="30" ry="34" fill={skinColor} />
        <circle cx="89" cy="78" r="6" fill={skinColor} />
        <circle cx="151" cy="78" r="6" fill={skinColor} />

        {/* Face */}
        <g id="face">
          <ellipse cx="108" cy="75" rx="3.5" ry="4" fill="#0f172a" />
          <ellipse cx="132" cy="75" rx="3.5" ry="4" fill="#0f172a" />
          <circle cx="109" cy="73.5" r="1.2" fill="#ffffff" />
          <circle cx="133" cy="73.5" r="1.2" fill="#ffffff" />

          <path d="M 103 66 Q 109 63 115 67" fill="none" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 125 67 Q 131 63 137 66" fill="none" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" />

          <path d="M 112 90 Q 120 98 128 90" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="102" cy="84" r="4" fill="#f43f5e" opacity="0.3" />
          <circle cx="138" cy="84" r="4" fill="#f43f5e" opacity="0.3" />
        </g>

        {/* Glasses */}
        {c.glasses === "round" && (
          <g id="glasses" stroke="#1e293b" strokeWidth="2.5" fill="none">
            <circle cx="108" cy="75" r="10" fill="rgba(255,255,255,0.2)" />
            <circle cx="132" cy="75" r="10" fill="rgba(255,255,255,0.2)" />
            <line x1="118" y1="75" x2="122" y2="75" />
          </g>
        )}
        {c.glasses === "sun" && (
          <g id="sunglasses" fill="#0f172a">
            <path d="M 97 68 L 118 68 L 115 84 L 100 84 Z" />
            <path d="M 122 68 L 143 68 L 140 84 L 125 84 Z" />
            <line x1="117" y1="72" x2="123" y2="72" stroke="#0f172a" strokeWidth="3" />
          </g>
        )}

        {/* Hair */}
        <g id="hair" fill={hairColor}>
          {c.hairStyle === "short-fade" && (
            <path d="M 89 70 Q 90 40 120 40 Q 150 40 151 70 Q 138 52 120 54 Q 102 52 89 70 Z" />
          )}

          {c.hairStyle === "spiky" && (
            <path d="M 90 68 L 96 46 L 108 52 L 120 38 L 132 52 L 144 46 L 150 68 Q 120 50 90 68 Z" />
          )}

          {c.hairStyle === "long-waves" && (
            <>
              <path d="M 88 70 Q 90 38 120 38 Q 150 38 152 70 Q 138 48 120 50 Q 102 48 88 70 Z" />
              <path d="M 88 72 Q 80 120 90 150 Q 94 110 93 75 Z" />
              <path d="M 152 72 Q 160 120 150 150 Q 146 110 147 75 Z" />
            </>
          )}

          {c.hairStyle === "ponytail" && (
            <>
              <path d="M 89 70 Q 90 40 120 40 Q 150 40 151 70 Z" />
              <path d="M 145 48 Q 175 45 168 95 Q 155 80 145 58 Z" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
};