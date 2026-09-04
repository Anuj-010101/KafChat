import { useState } from "react";
import { FiLogOut, FiMoreVertical, FiUser } from "react-icons/fi";
import Logo from "../common/Logo";
import Avatar from "../common/Avatar";
import ProfileModal from "../profile/ProfileModal";
import { useAuth } from "../../hooks/useAuth";

const Header = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-ink-border bg-ink-panel">
      <Logo size={30} />

      <div className="relative flex items-center gap-3">
        <button onClick={() => setProfileOpen(true)} className="flex items-center gap-3">
          <Avatar src={user?.avatar} alt={user?.fullName} size="sm" />
          <div className="hidden sm:block leading-tight text-left">
            <p className="text-sm font-medium text-ash">{user?.fullName}</p>
            <p className="text-xs text-ash-muted font-mono">@{user?.username}</p>
          </div>
        </button>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg text-ash-muted hover:text-ash hover:bg-ink-soft transition-colors"
          aria-label="Account menu"
        >
          <FiMoreVertical />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-48 bg-ink-panel border border-ink-border rounded-xl shadow-panel overflow-hidden z-20">
            <button
              onClick={() => {
                setProfileOpen(true);
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-ash-muted hover:bg-ink-soft hover:text-ash transition-colors"
            >
              <FiUser size={14} /> Edit profile
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <FiLogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
};

export default Header;
