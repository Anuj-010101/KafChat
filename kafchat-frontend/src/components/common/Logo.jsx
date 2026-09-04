const Logo = ({ size = 36, showWordmark = true, className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="11" fill="#121319" />
      <rect width="40" height="40" rx="11" stroke="#252833" />
      <path d="M9 10h4v9.5L20 10h5.5l-8 10 8.5 10H20l-7-9v9H9V10z" fill="#38BDF8" />
    </svg>
    {showWordmark && (
      <span className="font-display font-semibold text-lg text-ash tracking-tight">
        Kafchat
      </span>
    )}
  </div>
);

export default Logo;
