import { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiLock,
  FiKey,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiUser,
  FiShield,
  FiCamera,
  FiSliders,
  FiGrid,
  FiFilm,
  FiHeart,
  FiPlus,
  FiTrash2,
  FiSun,
  FiMoon,
  FiDroplet,
  FiType,
  FiImage,
  FiCheck,
  FiBookmark,
  FiSlash,
  FiHardDrive,
  FiAlertTriangle,
  FiChevronRight,
  FiArrowLeft,
  FiStar,
  FiCalendar,
  FiAward,
  FiSearch,
  FiZap,
  FiLogOut,
  FiUsers,
  FiEyeOff,
  FiEye,
  FiCreditCard,
  FiCheckCircle,
  FiHelpCircle,
  FiMessageSquare,
  FiMail,
  FiInfo,
} from "react-icons/fi";
import Button from "../common/Button";
import DualProfileBanner from "../common/DualProfileBanner";
import AvatarStudioModal from "../avatar/AvatarStudioModal";
import Avatar from "../common/Avatar";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { authService } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";
import { formatLastSeen } from "../../utils/formatTime";
import api from "../../services/api";
import toast from "react-hot-toast";

const SETTINGS_TOOLS = [
  {
    id: "About Profile",
    label: "About Profile",
    desc: "Basic account details, email, tier & membership date",
    icon: <FiInfo size={16} />,
  },
  {
    id: "My Posts",
    label: "Posts, DPs & Community",
    desc: "Single DP (PRO 5), followers, following & media",
    icon: <FiGrid size={16} />,
  },
  {
    id: "Profile",
    label: "Edit Profile",
    desc: "Bio, DOB, gender, location & links",
    icon: <FiUser size={16} />,
  },
  {
    id: "Privacy",
    label: "Privacy & Ghost Mode",
    desc: "Private account, ghost mode & hide online",
    icon: <FiShield size={16} />,
  },
  {
    id: "Close Friends",
    label: "Close Friends",
    desc: "Exclusive story sharing list",
    icon: <FiStar size={16} />,
  },
  {
    id: "Hide Story",
    label: "Hide Story From",
    desc: "Block specific users from viewing your stories",
    icon: <FiEyeOff size={16} />,
  },
  {
    id: "Archive & Saved",
    label: "Archive & Saved Hub",
    desc: "Story archive, saved posts & reels",
    icon: <FiBookmark size={16} />,
  },
  {
    id: "Theme",
    label: "Theme & Styles",
    desc: "Luxury palettes, typography & wallpapers",
    icon: <FiSliders size={16} />,
    tag: "Studio",
  },
  {
    id: "Storage",
    label: "Data & Storage",
    desc: "Cloud quota, HD upload & cache cleaner",
    icon: <FiHardDrive size={16} />,
    tag: "HD Vault",
  },
  {
    id: "Security & 2FA",
    label: "Security & 2FA Vault",
    desc: "Two-Factor Auth, password & linked devices",
    icon: <FiKey size={16} />,
  },
  {
    id: "Chat Lock PIN",
    label: "Chat & Archive Lock PIN",
    desc: "4-6 digit passcode for locked chats & archive",
    icon: <FiLock size={16} />,
  },
  {
    id: "VIP Hub",
    label: "KafChat VIP PRO Suite",
    desc: "5 DPs, 3m reels, 5GB cloud & anti-delete",
    icon: <FiAward size={16} />,
    tag: "👑 PRO",
  },
  {
    id: "Account Lifecycle",
    label: "Danger Zone",
    desc: "Log out active session & permanent deletion",
    icon: <FiAlertTriangle size={16} />,
    tag: "Danger",
  },
];

const COLOR_PRESETS = [
  { name: "Ocean Sky", accent: "#0284c7", isPro: false },
  { name: "Emerald Mint", accent: "#10b981", isPro: false },
  { name: "Purple Neon", accent: "#8b5cf6", isPro: false },
  { name: "Rose Pink", accent: "#f43f5e", isPro: false },
  { name: "Amber Gold", accent: "#f59e0b", isPro: false },
  { name: "Signal Blue", accent: "#38bdf8", isPro: false },
  { name: "Cyber Sunset (PRO)", accent: "linear-gradient(135deg, #f43f5e, #f59e0b)", isPro: true, colorVal: "#f43f5e" },
  { name: "Aurora Borealis (PRO)", accent: "linear-gradient(135deg, #10b981, #06b6d4)", isPro: true, colorVal: "#10b981" },
  { name: "Royal Purple Gold (PRO)", accent: "linear-gradient(135deg, #8b5cf6, #fbbf24)", isPro: true, colorVal: "#8b5cf6" },
  { name: "Midnight Neon (PRO)", accent: "linear-gradient(135deg, #06b6d4, #d946ef)", isPro: true, colorVal: "#06b6d4" },
  { name: "Crimson Velvet (PRO)", accent: "linear-gradient(135deg, #e11d48, #4c0519)", isPro: true, colorVal: "#e11d48" },
  { name: "Electric Matrix (PRO)", accent: "linear-gradient(135deg, #22c55e, #0f172a)", isPro: true, colorVal: "#22c55e" },
];

const FONTS = [
  { name: "Inter (Modern Default)", family: "'Inter', sans-serif", isPro: false },
  { name: "Poppins (Clean Geometric)", family: "'Poppins', sans-serif", isPro: false },
  { name: "Roboto (Classic Standard)", family: "'Roboto', sans-serif", isPro: false },
  { name: "Playfair (Luxury Serif)", family: "'Playfair Display', serif", isPro: true },
  { name: "JetBrains (Tech Mono)", family: "'JetBrains Mono', monospace", isPro: true },
  { name: "Cinzel (Royal Vintage)", family: "'Cinzel', serif", isPro: true },
  { name: "Plus Jakarta (Modern Sans)", family: "'Plus Jakarta Sans', sans-serif", isPro: true },
  { name: "Space Grotesk (Futuristic)", family: "'Space Grotesk', sans-serif", isPro: true },
];

const WALLPAPERS = [
  { name: "Default (Pure Color)", url: "" },
  {
    name: "Subtle Geometric",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Dark Mesh Matrix",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Cosmic Nebula",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Cyber Neon Tokyo",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop",
  },
  {
    name: "Minimalist Sand Dune",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop",
  },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const maxValidYear = currentYear - 13;
const minValidYear = 1920;
const YEARS = Array.from({ length: maxValidYear - minValidYear + 1 }, (_, i) => maxValidYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const ProfileModal = ({ onClose }) => {
  const { user, updateProfile, changePassword, setChatLockPin: setPinRemote, logout } = useAuth();
  const { chats = [], startChatWithUser } = useChat();
  const { theme, setPresetDark, setPresetLight, updateCustomTheme } = useTheme();

  const isVip = Boolean(user?.isVIP);

  const [activeTab, setActiveTab] = useState("About Profile");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [themeSubTab, setThemeSubTab] = useState("mode");
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);

  // Media Tab & Data
  const [gridTab, setGridTab] = useState("dps");
  const [archiveSubTab, setArchiveSubTab] = useState("posts");
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [archivedStories, setArchivedStories] = useState([]);
  const [profilePhotos, setProfilePhotos] = useState(
    Array.isArray(user?.profilePhotos)
      ? user.profilePhotos.map((p) => (typeof p === "string" ? p : p?.url))
      : []
  );
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Social Community
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [socialModalType, setSocialModalType] = useState(null);
  const [socialSearch, setSocialSearch] = useState("");
  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  // Form Fields
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [gender, setGender] = useState(user?.gender || "Prefer not to say");

  const initialDob = user?.dob ? new Date(user.dob) : null;
  const [birthDay, setBirthDay] = useState(initialDob ? initialDob.getDate() : "");
  const [birthMonth, setBirthMonth] = useState(initialDob ? initialDob.getMonth() + 1 : "");
  const [birthYear, setBirthYear] = useState(initialDob ? initialDob.getFullYear() : "");

  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [showDob, setShowDob] = useState(Boolean(user?.showDob));
  const [savingProfile, setSavingProfile] = useState(false);

  // Privacy Fields
  const [isPrivateAccount, setIsPrivateAccount] = useState(Boolean(user?.isPrivateAccount));
  const [isGhostModeActive, setIsGhostModeActive] = useState(Boolean(user?.isGhostModeActive));
  const [hideReadReceipts, setHideReadReceipts] = useState(Boolean(user?.hideReadReceipts));
  const [blockedUsersList, setBlockedUsersList] = useState([]);

  // Close Friends & Story Hide
  const [closeFriendsList, setCloseFriendsList] = useState([]);
  const [storyHiddenList, setStoryHiddenList] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [searchContact, setSearchContact] = useState("");
  const [searchHideContact, setSearchHideContact] = useState("");

  // Storage & HD Upload
  const [hdUploadEnabled, setHdUploadEnabled] = useState(Boolean(user?.hdUploadEnabled));

  // Security & 2FA
  const [is2FAEnabled, setIs2FAEnabled] = useState(Boolean(user?.is2FAEnabled));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Dynamic PIN
  const [pin, setPin] = useState(user?.lockPin ? user.lockPin.toString().replace(/^\$/, "") : "");
  const [savingPin, setSavingPin] = useState(false);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [accountPasswordForPinReset, setAccountPasswordForPinReset] = useState("");
  const [newPinAfterReset, setNewPinAfterReset] = useState("");
  const [resettingPin, setResettingPin] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const otherDevices = sessions.filter((s) => !s.isCurrent);

  const multiDpInputRef = useRef(null);
  const maxAllowedDps = isVip ? 5 : 1;
  const currentUserId = (user?._id || user?.id)?.toString();

  useEffect(() => {
    if (user?._id) {
      const fetchMediaAndSocial = async () => {
        try {
          setLoadingMedia(true);
          const [mediaRes, socialRes] = await Promise.allSettled([
            api.get(`/social/user/${user._id}/posts`),
            api.get(`/users/${user._id}/network`),
          ]);

          if (mediaRes.status === "fulfilled" && mediaRes.value.data) {
            const data = mediaRes.value.data;
            setUserPosts(data.posts || []);
            setUserReels(data.reels || []);
            setSavedPosts(data.savedPosts || data.saved || []);
            setSavedReels(data.savedReels || []);
            setArchivedStories(data.archivedStories || []);
          }

          let fetchedFollowers = [];
          let fetchedFollowing = [];

          if (socialRes.status === "fulfilled" && socialRes.value.data) {
            fetchedFollowers = socialRes.value.data.followers || [];
            fetchedFollowing = socialRes.value.data.following || [];
          } else {
            fetchedFollowers = user.followers || [];
            fetchedFollowing = user.following || [];
          }

          if (fetchedFollowers.length === 0 && fetchedFollowing.length === 0 && chats.length > 0) {
            const connectedFriends = chats
              .filter((c) => !c.isGroupChat && !c.isSavedCloud && !c.isSelfChat)
              .map((c) => c.participants?.find((p) => (p?._id || p)?.toString() !== currentUserId))
              .filter(Boolean);

            fetchedFollowers = connectedFriends;
            fetchedFollowing = connectedFriends;
          }

          setFollowersList(fetchedFollowers);
          setFollowingList(fetchedFollowing);
        } catch {
          setUserPosts([]);
          setUserReels([]);
          setSavedPosts([]);
          setSavedReels([]);
          setArchivedStories([]);
        } finally {
          setLoadingMedia(false);
        }
      };
      fetchMediaAndSocial();
    }
  }, [user?._id, activeTab, chats, currentUserId]);

  useEffect(() => {
    if (activeTab === "Privacy") {
      api
        .get("/users/blocked")
        .then(({ data }) => setBlockedUsersList(data.blocked || []))
        .catch(() => setBlockedUsersList([]));
    }
    if (activeTab === "Close Friends" || activeTab === "Hide Story") {
      api
        .get("/users/close-friends")
        .then(({ data }) => {
          setCloseFriendsList(data.closeFriends || []);
          setStoryHiddenList(data.hiddenFrom || []);
          setAllContacts(data.contacts || []);
        })
        .catch(() => {});
    }
    if (activeTab === "Security & 2FA") {
      fetchSessions();
    }
    if (activeTab === "Chat Lock PIN") {
      if (user?.lockPin) {
        setPin(user.lockPin.toString().replace(/^\$/, ""));
      }
    }
  }, [activeTab, user?.lockPin]);

  const handleSelectTool = (toolId) => {
    setActiveTab(toolId);
    setMobileDetailOpen(true);
  };

  const handleAddMultipleDPs = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!isVip && files.length > 1) {
      toast.error("Free tier supports 1 Profile Photo. Upgrade to VIP PRO for up to 5 DPs.");
      return;
    }

    if (profilePhotos.length + files.length > maxAllowedDps) {
      toast.error(`Maximum ${maxAllowedDps} Profile Photo${maxAllowedDps > 1 ? "s" : ""} allowed.`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePhotos((prev) => (!isVip ? [reader.result] : [...prev, reader.result]));
      };
      reader.readAsDataURL(file);
    });

    toast.success("Profile photo uploaded! Click Save Changes to persist.");
  };

  const handleRemoveDP = (index) => {
    setProfilePhotos((prev) => prev.filter((_, i) => i !== index));
    toast.success("Photo removed");
  };

  const fetchSessions = async () => {
    try {
      const { data } = await authService.getSessions();
      setSessions(data.sessions || []);
    } catch {
      toast.error("Could not load linked devices");
    }
  };

  const handleLogoutSession = async (sessionId) => {
    try {
      await authService.logoutSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Device logged out remotely! 🔒");
    } catch {
      toast.error("Failed to log out device");
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      await authService.logoutAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Logged out from all other devices! 🔒");
    } catch {
      toast.error("Failed to log out other devices");
    }
  };

  const handleToggleCloseFriend = async (contactId) => {
    try {
      const { data } = await api.post(`/users/close-friends/${contactId}/toggle`);
      if (data.isCloseFriend) {
        setCloseFriendsList((prev) => [...prev, contactId]);
        toast.success("Added to Close Friends ⭐");
      } else {
        setCloseFriendsList((prev) => prev.filter((id) => id !== contactId));
        toast.success("Removed from Close Friends");
      }
    } catch {
      toast.error("Failed to update Close Friends");
    }
  };

  const handleToggleStoryHide = async (contactId) => {
    try {
      const { data } = await api.post(`/users/story-hide/${contactId}/toggle`);
      if (data.isStoryHidden) {
        setStoryHiddenList((prev) => [...prev, contactId]);
        toast.success("Story hidden from user 🚫");
      } else {
        setStoryHiddenList((prev) => prev.filter((id) => id !== contactId));
        toast.success("Story unhidden for user");
      }
    } catch {
      toast.error("Failed to update story privacy");
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await api.post(`/users/unblock/${userId}`);
      setBlockedUsersList((prev) => prev.filter((u) => u._id !== userId));
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  const handleClearCache = () => {
    try {
      const keysToKeep = ["kafchat_token", "token", "kafchat_user", "kafchat_theme", "kafchat_device_id"];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      toast.success("Thumbnails & media cache cleared! 🧹");
    } catch {
      toast.error("Failed to clear cache");
    }
  };

  const handleProceedPayment = async () => {
    if (!selectedPlanForPayment) return;
    setProcessingPayment(true);
    const toastId = toast.loading(`Processing ${selectedPlanForPayment} VIP PRO pass...`);

    try {
      const simulatedPaymentId = `PAY_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const { data } = await authService.activateVip(selectedPlanForPayment, simulatedPaymentId);

      toast.dismiss(toastId);
      if (data.success) {
        toast.success(`👑 VIP PRO ${selectedPlanForPayment} Plan Activated! 🎉`);
        setSelectedPlanForPayment(null);
        window.location.reload();
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Payment transaction failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();

    let formattedDob = null;
    if (birthYear && birthMonth && birthDay) {
      const d = new Date(birthYear, birthMonth - 1, birthDay);
      if (
        d.getFullYear() !== Number(birthYear) ||
        d.getMonth() + 1 !== Number(birthMonth) ||
        d.getDate() !== Number(birthDay)
      ) {
        toast.error("Invalid calendar date selected for DOB!");
        return;
      }
      formattedDob = d.toISOString();
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        fullName,
        bio,
        avatar: profilePhotos[0] || avatar || user?.avatar,
        profilePhotos,
        gender,
        dob: formattedDob,
        location,
        website,
        showDob,
        isPrivateAccount,
        isGhostModeActive,
        hideReadReceipts,
        hdUploadEnabled,
      });
      toast.success("Profile & Settings saved! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setSavingPassword(true);
    const toastId = toast.loading("Updating password...");

    try {
      const res = await changePassword({ currentPassword, newPassword });
      toast.dismiss(toastId);
      toast.success(res?.message || "Password changed successfully! 🎉");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Incorrect current password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    const cleanDigits = pin.toString().replace(/\D/g, "").trim();
    if (cleanDigits.length < 4 || cleanDigits.length > 6) {
      toast.error("PIN must be 4 to 6 digits!");
      return;
    }

    setSavingPin(true);
    const toastId = toast.loading("Saving secret code...");
    try {
      const { data } = await api.patch("/auth/chat-lock-pin", { pin: cleanDigits });
      toast.dismiss(toastId);
      if (data.success) {
        if (setPinRemote) await setPinRemote(cleanDigits);

        const localUser = JSON.parse(localStorage.getItem("kafchat_user") || "{}");
        localUser.lockPin = cleanDigits;
        localStorage.setItem("kafchat_user", JSON.stringify(localUser));

        setPin(cleanDigits);
        toast.success(`Secret Vault Code updated to $${cleanDigits}! 🔐`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Failed to save PIN");
    } finally {
      setSavingPin(false);
    }
  };

  const handleResetPinWithPassword = async (e) => {
    e.preventDefault();
    const cleanDigits = newPinAfterReset.toString().replace(/\D/g, "").trim();
    if (!accountPasswordForPinReset) {
      toast.error("Please enter your account password");
      return;
    }
    if (cleanDigits.length < 4 || cleanDigits.length > 6) {
      toast.error("New PIN must be at least 4 digits");
      return;
    }

    setResettingPin(true);
    const toastId = toast.loading("Verifying password & resetting PIN...");
    try {
      const { data } = await api.post("/auth/reset-chat-lock-pin", {
        password: accountPasswordForPinReset,
        newPin: cleanDigits,
      });

      toast.dismiss(toastId);
      if (data.success) {
        if (setPinRemote) await setPinRemote(cleanDigits);

        const localUser = JSON.parse(localStorage.getItem("kafchat_user") || "{}");
        localUser.lockPin = cleanDigits;
        localStorage.setItem("kafchat_user", JSON.stringify(localUser));

        setPin(cleanDigits);
        setShowForgotPinModal(false);
        setAccountPasswordForPinReset("");
        setNewPinAfterReset("");
        toast.success(`Vault Code successfully reset to $${cleanDigits}! 🔐`);
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || "Incorrect account password");
    } finally {
      setResettingPin(false);
    }
  };

  const getDeviceIcon = (os = "") => {
    const lower = os.toLowerCase();
    if (lower.includes("android") || lower.includes("ios") || lower.includes("phone")) {
      return <FiSmartphone size={15} />;
    }
    if (lower.includes("tablet") || lower.includes("ipad")) {
      return <FiTablet size={15} />;
    }
    return <FiMonitor size={15} />;
  };

  const activeUserPin = (user?.lockPin || pin || "").toString().replace(/^\$/, "");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn select-none">
        <div className="w-full sm:max-w-4xl h-[92vh] sm:h-[84vh] theme-panel-bg border-t sm:border theme-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-bubbleIn">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b theme-border theme-soft-bg/40 shrink-0">
            <div className="flex items-center gap-2.5">
              {mobileDetailOpen && (
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="sm:hidden p-1.5 rounded-xl theme-soft-bg theme-text hover:opacity-80"
                >
                  <FiArrowLeft size={16} />
                </button>
              )}
              <div className="w-7 h-7 rounded-lg theme-accent-tint flex items-center justify-center">
                <FiShield size={15} />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold theme-text tracking-wide">
                  Account & Settings
                </h2>
                {isVip && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[10px] font-black flex items-center gap-1 shadow-sm">
                    👑 VIP PRO
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="theme-text-muted hover:theme-text p-1.5 rounded-xl hover:theme-soft-bg transition"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Master Split Navigation Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* 1. SETTINGS NAVIGATION LIST */}
            <aside
              className={`w-full sm:w-72 sm:border-r theme-border theme-soft-bg/30 flex-col overflow-y-auto scrollbar-thin p-3 sm:flex ${
                mobileDetailOpen ? "hidden sm:flex" : "flex"
              }`}
            >
              <div className="flex flex-col gap-1.5">
                {SETTINGS_TOOLS.map((tool) => {
                  const isSelected = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool.id)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? "theme-accent-bg text-white shadow-md font-bold"
                          : "theme-panel-bg border theme-border hover:theme-soft-bg theme-text"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "theme-soft-bg theme-accent-text"
                          }`}
                        >
                          {tool.icon}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate">{tool.label}</span>
                          <span
                            className={`text-[10px] truncate ${
                              isSelected ? "text-white/80" : "theme-text-muted"
                            }`}
                          >
                            {tool.desc}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {tool.tag && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${
                              isSelected
                                ? "bg-white text-black"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {tool.tag}
                          </span>
                        )}
                        <FiChevronRight
                          size={14}
                          className={isSelected ? "text-white" : "theme-text-muted"}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* 2. DEDICATED SETTINGS CONFIGURATION WORKSPACE */}
            <main
              className={`flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin ${
                !mobileDetailOpen ? "hidden sm:block" : "block"
              }`}
            >
              {/* TOOL 0: ABOUT PROFILE */}
              {activeTab === "About Profile" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-3xl theme-soft-bg border theme-border">
                    <Avatar src={user?.avatar} alt={user?.fullName} size="lg" />
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-bold theme-text flex items-center gap-1.5 truncate">
                        {user?.fullName}
                        {isVip && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase">
                            PRO
                          </span>
                        )}
                      </h3>
                      <span className="text-xs theme-accent-text font-mono truncate">@{user?.username}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-3">
                    <span className="text-xs font-bold theme-text uppercase tracking-wider">Account Details</span>

                    <div className="flex items-center justify-between py-1.5 border-b theme-border">
                      <span className="text-xs theme-text-muted flex items-center gap-2"><FiMail size={14} /> Email Address</span>
                      <span className="text-xs font-semibold theme-text font-mono">{user?.email || "Not linked"}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b theme-border">
                      <span className="text-xs theme-text-muted flex items-center gap-2"><FiAward size={14} /> Account Tier</span>
                      <span className={`text-xs font-bold ${isVip ? "text-amber-400" : "theme-text"}`}>
                        {isVip ? "👑 VIP PRO Member" : "Free Member"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b theme-border">
                      <span className="text-xs theme-text-muted flex items-center gap-2"><FiUser size={14} /> Gender</span>
                      <span className="text-xs font-semibold theme-text">{user?.gender || "Prefer not to say"}</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b theme-border">
                      <span className="text-xs theme-text-muted flex items-center gap-2"><FiCalendar size={14} /> Date of Birth</span>
                      <span className="text-xs font-semibold theme-text">
                        {user?.dob ? new Date(user.dob).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" }) : "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs theme-text-muted flex items-center gap-2"><FiShield size={14} /> Joined KafChat</span>
                      <span className="text-xs font-semibold theme-text font-mono">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" }) : "Recently Joined"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOL 1: POSTS, DPS & COMMUNITY */}
              {activeTab === "My Posts" && (
                <div className="flex flex-col gap-4">
                  <DualProfileBanner
                    user={{ ...user, avatar: profilePhotos[0] || avatar || user?.avatar, fullName }}
                    isSelf={true}
                    onEditAvatar={() => setShowAvatarStudio(true)}
                    onChangeDp={() => multiDpInputRef.current?.click()}
                  />

                  <input
                    type="file"
                    ref={multiDpInputRef}
                    onChange={handleAddMultipleDPs}
                    accept="image/*"
                    multiple={isVip}
                    className="hidden"
                  />

                  {/* Followers, Following, Posts & DPs Bar */}
                  <div className="grid grid-cols-4 gap-2 p-3 rounded-2xl theme-soft-bg border theme-border text-center">
                    <button
                      type="button"
                      onClick={() => { setSocialModalType("followers"); setSocialSearch(""); }}
                      className="flex flex-col items-center hover:opacity-80 transition"
                    >
                      <span className="text-sm font-bold theme-text">{followersList.length}</span>
                      <span className="text-[10px] theme-accent-text font-semibold">Followers</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSocialModalType("following"); setSocialSearch(""); }}
                      className="flex flex-col items-center hover:opacity-80 transition"
                    >
                      <span className="text-sm font-bold theme-text">{followingList.length}</span>
                      <span className="text-[10px] theme-accent-text font-semibold">Following</span>
                    </button>

                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold theme-text">{userPosts.length + userReels.length}</span>
                      <span className="text-[10px] theme-text-muted font-medium">Posts</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold theme-text">{profilePhotos.length}</span>
                      <span className="text-[10px] theme-text-muted font-medium">DPs ({profilePhotos.length}/{maxAllowedDps})</span>
                    </div>
                  </div>

                  <div className="flex items-center border-b theme-border overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setGridTab("dps")}
                      className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition whitespace-nowrap px-2 ${
                        gridTab === "dps"
                          ? "border-sky-500 theme-accent-text font-bold"
                          : "border-transparent theme-text-muted hover:theme-text"
                      }`}
                    >
                      <FiCamera size={14} /> DPs ({profilePhotos.length}/{maxAllowedDps})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGridTab("posts")}
                      className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition whitespace-nowrap px-2 ${
                        gridTab === "posts"
                          ? "border-sky-500 theme-accent-text font-bold"
                          : "border-transparent theme-text-muted hover:theme-text"
                      }`}
                    >
                      <FiGrid size={14} /> Posts ({userPosts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGridTab("reels")}
                      className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition whitespace-nowrap px-2 ${
                        gridTab === "reels"
                          ? "border-pink-500 text-pink-500 font-bold"
                          : "border-transparent theme-text-muted hover:theme-text"
                      }`}
                    >
                      <FiFilm size={14} /> Reels ({userReels.length})
                    </button>
                  </div>

                  <div className="min-h-[140px]">
                    {loadingMedia ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 rounded-full border-2 theme-accent-border border-t-transparent animate-spin" />
                      </div>
                    ) : gridTab === "dps" ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs theme-text-muted">
                            Profile Photos ({isVip ? "VIP PRO Max 5 DPs" : "Free Tier: 1 DP"})
                          </span>
                          <button
                            type="button"
                            onClick={() => multiDpInputRef.current?.click()}
                            disabled={profilePhotos.length >= maxAllowedDps}
                            className="px-3 py-1.5 rounded-xl theme-accent-tint text-xs font-bold flex items-center gap-1 transition hover:opacity-90 disabled:opacity-40"
                          >
                            <FiPlus size={13} /> {isVip ? "Add DP" : "Change DP"}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          {profilePhotos.map((photoUrl, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-2xl overflow-hidden border theme-border group"
                            >
                              <img
                                src={photoUrl}
                                alt={`DP ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveDP(idx)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-500 text-white transition"
                                title="Delete Photo"
                              >
                                <FiTrash2 size={12} />
                              </button>
                              {idx === 0 && (
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded theme-accent-bg text-white text-[9px] font-bold">
                                  PRIMARY
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : gridTab === "posts" ? (
                      userPosts.length === 0 ? (
                        <p className="text-center py-8 text-xs theme-text-muted">
                          No posts yet. Take photos in Camera Studio! 📸
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {userPosts.map((post) => (
                            <div
                              key={post._id}
                              className="relative aspect-square rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                              onClick={() => window.open(post.mediaUrl, "_blank")}
                            >
                              <img
                                src={post.mediaUrl}
                                alt="Post"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                                <FiHeart size={14} className="fill-white" />{" "}
                                {post.likes?.length || 0}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : userReels.length === 0 ? (
                      <p className="text-center py-8 text-xs theme-text-muted">
                        No reels yet. Record videos in Camera Studio! 🎬
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {userReels.map((reel) => (
                          <div
                            key={reel._id}
                            className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                            onClick={() => window.open(reel.videoUrl || reel.mediaUrl, "_blank")}
                          >
                            <video
                              src={reel.videoUrl || reel.mediaUrl}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white">
                              <FiFilm size={20} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TOOL 2: EDIT PROFILE */}
              {activeTab === "Profile" && (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold theme-text">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full theme-soft-bg border theme-border rounded-xl px-3.5 py-2.5 text-xs theme-text outline-none theme-accent-focus transition"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold theme-text">About / Bio</label>
                    <textarea
                      value={bio}
                      maxLength={160}
                      rows={2}
                      placeholder="Tell something about yourself..."
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full theme-soft-bg border theme-border rounded-xl px-3.5 py-2 text-xs theme-text outline-none theme-accent-focus transition"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold theme-text">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2.5 text-xs theme-text outline-none theme-accent-focus"
                      >
                        <option value="Prefer not to say">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold theme-text flex items-center justify-between">
                        <span>Date of Birth</span>
                        <span className="text-[10px] theme-text-muted font-normal">(Min age 13+)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="theme-soft-bg border theme-border rounded-xl px-2.5 py-2.5 text-xs theme-text outline-none theme-accent-focus"
                        >
                          <option value="">Day</option>
                          {DAYS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>

                        <select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="theme-soft-bg border theme-border rounded-xl px-2.5 py-2.5 text-xs theme-text outline-none theme-accent-focus truncate"
                        >
                          <option value="">Month</option>
                          {MONTHS.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                          ))}
                        </select>

                        <select
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="theme-soft-bg border theme-border rounded-xl px-2.5 py-2.5 text-xs theme-text outline-none theme-accent-focus"
                        >
                          <option value="">Year</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold theme-text">Location / City</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai, India"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full theme-soft-bg border theme-border rounded-xl px-3.5 py-2.5 text-xs theme-text outline-none theme-accent-focus"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold theme-text">Website / Link</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full theme-soft-bg border theme-border rounded-xl px-3.5 py-2.5 text-xs theme-text outline-none theme-accent-focus"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={savingProfile}
                    className="w-full mt-2 py-2.5 theme-accent-bg text-white font-bold"
                  >
                    Save Profile Changes
                  </Button>
                </form>
              )}

              {/* TOOL 3: PRIVACY & GHOST MODE */}
              {activeTab === "Privacy" && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-3">
                    <span className="text-xs font-bold theme-text uppercase tracking-wider">
                      Audience & Visibility
                    </span>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold theme-text">Private Account</span>
                        <span className="text-[10px] theme-text-muted">
                          Only approved followers can see your profile media & stories
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          isPrivateAccount ? "theme-accent-bg" : "bg-gray-400 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            isPrivateAccount ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t theme-border">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold theme-text">
                          Ghost Mode (Hide Online & Last Seen)
                        </span>
                        <span className="text-[10px] theme-text-muted">
                          Turns off green dot indicator and active timestamps
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGhostModeActive(!isGhostModeActive)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          isGhostModeActive ? "theme-accent-bg" : "bg-gray-400 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            isGhostModeActive ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t theme-border">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold theme-text">
                          Hide Blue Read Receipts (Seen Ticks)
                        </span>
                        <span className="text-[10px] theme-text-muted">
                          Others won't know when you read their messages
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHideReadReceipts(!hideReadReceipts)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          hideReadReceipts ? "theme-accent-bg" : "bg-gray-400 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            hideReadReceipts ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t theme-border">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold theme-text">Show Date of Birth</span>
                        <span className="text-[10px] theme-text-muted">
                          {showDob ? "Visible to public" : "Hidden from profile"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDob(!showDob)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          showDob ? "theme-accent-bg" : "bg-gray-400 dark:bg-gray-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            showDob ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-3">
                    <span className="text-xs font-bold theme-text uppercase tracking-wider flex items-center gap-1.5">
                      <FiSlash className="text-red-500" /> Blocked Accounts ({blockedUsersList.length})
                    </span>

                    {blockedUsersList.length === 0 ? (
                      <p className="text-xs theme-text-muted italic text-center py-2">
                        No blocked users.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto scrollbar-thin">
                        {blockedUsersList.map((blocked) => (
                          <div
                            key={blocked._id}
                            className="p-2 rounded-xl theme-panel-bg border theme-border flex items-center justify-between"
                          >
                            <span className="text-xs font-semibold theme-text">
                              {blocked.fullName || `@${blocked.username}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUnblockUser(blocked._id)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-500 text-[11px] font-bold hover:bg-red-500 hover:text-white transition"
                            >
                              Unblock
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    loading={savingProfile}
                    className="w-full py-2.5 theme-accent-bg text-white font-bold"
                  >
                    Save Privacy Settings
                  </Button>
                </div>
              )}

              {/* TOOL 4: CLOSE FRIENDS */}
              {activeTab === "Close Friends" && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                        ⭐
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold theme-text">Close Friends List</span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {closeFriendsList.length} people selected for private stories
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 theme-text-muted" size={14} />
                    <input
                      type="text"
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                      placeholder="Search followers & contacts..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl theme-soft-bg border theme-border text-xs theme-text outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-thin">
                    {allContacts
                      .filter((c) =>
                        c.fullName?.toLowerCase().includes(searchContact.toLowerCase()) ||
                        c.username?.toLowerCase().includes(searchContact.toLowerCase())
                      )
                      .map((contact) => {
                        const isCF = closeFriendsList.includes(contact._id);
                        return (
                          <div
                            key={contact._id}
                            className="p-2.5 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar src={contact.avatar} alt={contact.fullName} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold theme-text truncate">{contact.fullName}</span>
                                <span className="text-[10px] theme-text-muted font-mono truncate">@{contact.username}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleCloseFriend(contact._id)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                isCF
                                  ? "bg-emerald-500 text-black shadow"
                                  : "theme-panel-bg border theme-border theme-text-muted hover:theme-text"
                              }`}
                            >
                              {isCF ? <><FiCheck size={12} /> Added</> : <><FiPlus size={12} /> Add</>}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TOOL 5: HIDE STORY FROM */}
              {activeTab === "Hide Story" && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg">
                        🚫
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold theme-text">Hide Story From</span>
                        <span className="text-[10px] text-pink-400 font-medium">
                          {storyHiddenList.length} people restricted from seeing your stories
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 theme-text-muted" size={14} />
                    <input
                      type="text"
                      value={searchHideContact}
                      onChange={(e) => setSearchHideContact(e.target.value)}
                      placeholder="Search people to hide story..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl theme-soft-bg border theme-border text-xs theme-text outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-thin">
                    {allContacts
                      .filter((c) =>
                        c.fullName?.toLowerCase().includes(searchHideContact.toLowerCase()) ||
                        c.username?.toLowerCase().includes(searchHideContact.toLowerCase())
                      )
                      .map((contact) => {
                        const isHidden = storyHiddenList.includes(contact._id);
                        return (
                          <div
                            key={contact._id}
                            className="p-2.5 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar src={contact.avatar} alt={contact.fullName} size="sm" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold theme-text truncate">{contact.fullName}</span>
                                <span className="text-[10px] theme-text-muted font-mono truncate">@{contact.username}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleStoryHide(contact._id)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                isHidden
                                  ? "bg-red-500 text-white shadow"
                                  : "theme-panel-bg border theme-border theme-text-muted hover:theme-text"
                              }`}
                            >
                              {isHidden ? <><FiSlash size={12} /> Hidden</> : <><FiEyeOff size={12} /> Hide</>}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TOOL 6: ARCHIVE & SAVED HUB */}
              {activeTab === "Archive & Saved" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center border-b theme-border">
                    <button
                      type="button"
                      onClick={() => setArchiveSubTab("posts")}
                      className={`flex-1 py-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
                        archiveSubTab === "posts"
                          ? "border-amber-500 text-amber-500"
                          : "border-transparent theme-text-muted hover:theme-text"
                      }`}
                    >
                      <FiBookmark size={14} /> Saved Posts ({savedPosts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveSubTab("reels")}
                      className={`flex-1 py-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
                        archiveSubTab === "reels"
                          ? "border-pink-500 text-pink-500"
                          : "border-transparent theme-text-muted hover:theme-text"
                      }`}
                    >
                      <FiFilm size={14} /> Saved Reels ({savedReels.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveSubTab("archive")}
                      className={`flex-1 py-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
                        archiveSubTab === "archive"
                          ? "border-cyan-400 theme-accent-text"
                          : "border-transparent theme-text-muted hover:theme-text"
                      }`}
                    >
                      <FiCalendar size={14} /> Story Archive ({archivedStories.length})
                    </button>
                  </div>

                  <div className="min-h-[160px]">
                    {archiveSubTab === "posts" ? (
                      savedPosts.length === 0 ? (
                        <p className="text-center py-10 text-xs theme-text-muted">No saved bookmarks yet.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {savedPosts.map((item) => (
                            <div
                              key={item._id}
                              className="relative aspect-square rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                              onClick={() => window.open(item.mediaUrl, "_blank")}
                            >
                              <img src={item.mediaUrl} alt="Saved Post" className="w-full h-full object-cover group-hover:scale-105 transition" />
                            </div>
                          ))}
                        </div>
                      )
                    ) : archiveSubTab === "reels" ? (
                      savedReels.length === 0 ? (
                        <p className="text-center py-10 text-xs theme-text-muted">No saved reels bookmarked yet.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {savedReels.map((item) => (
                            <div
                              key={item._id}
                              className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                              onClick={() => window.open(item.videoUrl || item.mediaUrl, "_blank")}
                            >
                              <video src={item.videoUrl || item.mediaUrl} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )
                    ) : archivedStories.length === 0 ? (
                      <p className="text-center py-10 text-xs theme-text-muted">No expired stories archived yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {archivedStories.map((story) => (
                          <div
                            key={story._id}
                            className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border theme-border cursor-pointer group"
                            onClick={() => window.open(story.mediaUrl, "_blank")}
                          >
                            <img src={story.mediaUrl} alt="Archived Story" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/60 backdrop-blur-sm text-[9px] text-white font-mono text-center truncate">
                              {new Date(story.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TOOL 7: THEME & STYLES STUDIO */}
              {activeTab === "Theme" && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-1.5 p-1 rounded-2xl theme-soft-bg border theme-border overflow-x-auto scrollbar-none">
                    {[
                      { id: "mode", label: "Mode", icon: <FiSun size={12} /> },
                      { id: "colors", label: "Palette", icon: <FiDroplet size={12} /> },
                      { id: "font", label: "Typography", icon: <FiType size={12} /> },
                      { id: "wallpaper", label: "Wallpaper", icon: <FiImage size={12} /> },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setThemeSubTab(sub.id)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition ${
                          themeSubTab === sub.id
                            ? "theme-accent-bg text-white shadow"
                            : "theme-text-muted hover:theme-text"
                        }`}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>

                  {themeSubTab === "mode" && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div
                        onClick={setPresetLight}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2.5 text-center ${
                          theme.mode === "light"
                            ? "theme-accent-border theme-accent-tint shadow-lg"
                            : "theme-border theme-soft-bg/50 hover:theme-soft-bg"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <FiSun size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold theme-text">Light Mode</h4>
                          <p className="text-[10px] theme-text-muted mt-0.5">Crisp daylight look</p>
                        </div>
                      </div>

                      <div
                        onClick={setPresetDark}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2.5 text-center ${
                          theme.mode === "dark"
                            ? "theme-accent-border theme-accent-tint shadow-lg"
                            : "theme-border theme-soft-bg/50 hover:theme-soft-bg"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                          <FiMoon size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold theme-text">Dark Mode</h4>
                          <p className="text-[10px] theme-text-muted mt-0.5">Deep OLED contrast</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {themeSubTab === "colors" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {COLOR_PRESETS.map((preset) => {
                        const isSelected = theme.accentColor === (preset.colorVal || preset.accent);
                        return (
                          <div
                            key={preset.name}
                            onClick={() => {
                              if (preset.isPro && !isVip) {
                                toast.error("👑 PRO Feature: Upgrade to VIP to unlock neon luxury gradients!");
                                return;
                              }
                              updateCustomTheme({ accentColor: preset.colorVal || preset.accent });
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? "theme-accent-border theme-soft-bg shadow"
                                : "theme-border theme-soft-bg/40 hover:theme-soft-bg"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-5 h-5 rounded-full shadow-inner border border-black/10 shrink-0"
                                style={{ background: preset.accent }}
                              />
                              <span className="text-xs font-semibold theme-text">{preset.name}</span>
                            </div>
                            {preset.isPro && !isVip ? (
                              <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-black">
                                PRO
                              </span>
                            ) : isSelected ? (
                              <FiCheck className="theme-accent-text font-bold" size={15} />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {themeSubTab === "font" && (
                    <div className="flex flex-col gap-2 pt-1">
                      {FONTS.map((f) => {
                        const isSelected = theme.fontFamily === f.family;
                        return (
                          <div
                            key={f.name}
                            onClick={() => {
                              if (f.isPro && !isVip) {
                                toast.error("👑 PRO Feature: Upgrade to VIP to unlock luxury fonts!");
                                return;
                              }
                              updateCustomTheme({ fontFamily: f.family });
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? "theme-accent-border theme-soft-bg shadow"
                                : "theme-border theme-soft-bg/40 hover:theme-soft-bg"
                            }`}
                            style={{ fontFamily: f.family }}
                          >
                            <span className="text-xs font-semibold theme-text">{f.name}</span>
                            {f.isPro && !isVip ? (
                              <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-black">
                                PRO
                              </span>
                            ) : isSelected ? (
                              <FiCheck className="theme-accent-text shrink-0" size={15} />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {themeSubTab === "wallpaper" && (
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
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
                                  bgValue: theme.mode === "light" ? "#f8fafc" : "#080b11",
                                });
                              } else {
                                updateCustomTheme({ bgType: "image", bgValue: w.url });
                              }
                            }}
                            className={`relative h-24 rounded-2xl border-2 cursor-pointer overflow-hidden flex flex-col justify-end p-2 transition-all ${
                              isSelected ? "theme-accent-border ring-2 ring-sky-500/20" : "theme-border"
                            }`}
                            style={{
                              backgroundImage: w.url ? `url('${w.url}')` : "none",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              backgroundColor: w.url ? "transparent" : "var(--app-soft-bg)",
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <span className="relative z-10 text-[11px] font-bold text-white truncate">{w.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TOOL 8: DATA & STORAGE */}
              {activeTab === "Storage" && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold theme-text uppercase tracking-wider flex items-center gap-1.5">
                        <FiHardDrive className="theme-accent-text" /> Cloud Storage Quota
                      </span>
                      <span className="text-xs font-bold theme-text">
                        {isVip ? "1.4 GB / 5.0 GB (PRO)" : "220 MB / 500 MB (Free)"}
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                      <div className={`h-full ${isVip ? "w-[28%] bg-gradient-to-r from-amber-400 to-cyan-400" : "w-[44%] bg-cyan-400"}`} />
                    </div>

                    <div className="flex items-center justify-between text-[10px] theme-text-muted pt-1">
                      <span>Photos & Videos: {isVip ? "900 MB" : "150 MB"}</span>
                      <span>Voice Notes: {isVip ? "320 MB" : "50 MB"}</span>
                      <span>Docs: {isVip ? "180 MB" : "20 MB"}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-3">
                    <span className="text-xs font-bold theme-text uppercase tracking-wider flex items-center gap-1.5">
                      <FiHardDrive className="theme-accent-text" /> Media Upload Quality
                    </span>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold theme-text flex items-center gap-1.5">
                          Upload in HD Quality {isVip && <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-black">PRO</span>}
                        </span>
                        <span className="text-[10px] theme-text-muted">
                          {isVip ? "Send photos and media in high-definition clarity" : "⭐ Upgrade to VIP PRO to toggle HD photo uploads"}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!isVip}
                        onClick={() => setHdUploadEnabled(!hdUploadEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          hdUploadEnabled && isVip ? "theme-accent-bg" : "bg-gray-400 dark:bg-gray-700 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${hdUploadEnabled && isVip ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-2">
                    <span className="text-xs font-bold theme-text uppercase tracking-wider">Cache Cleaner</span>
                    <p className="text-[11px] theme-text-muted">Clear cached thumbnails without affecting your messages.</p>
                    <Button
                      onClick={handleClearCache}
                      className="w-full py-2 bg-red-500/15 text-red-500 border border-red-500/30 text-xs font-bold hover:bg-red-500 hover:text-white transition"
                    >
                      🧹 Clear Cache
                    </Button>
                  </div>

                  <Button onClick={handleSaveProfile} loading={savingProfile} className="w-full py-2.5 theme-accent-bg text-white font-bold">
                    Save Storage Preferences
                  </Button>
                </div>
              )}

              {/* TOOL 9: SECURITY & 2FA VAULT */}
              {activeTab === "Security & 2FA" && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold theme-text flex items-center gap-1.5">
                        <FiShield className="theme-accent-text" /> Two-Factor Authentication (2FA)
                      </span>
                      <span className="text-[10px] theme-text-muted">Requires OTP passcode on new logins</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIs2FAEnabled(!is2FAEnabled);
                        toast.success(!is2FAEnabled ? "2FA Protection Enabled! 🛡️" : "2FA Disabled");
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                        is2FAEnabled ? "theme-accent-bg" : "bg-gray-400 dark:bg-gray-700"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${is2FAEnabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <form onSubmit={handleSavePassword} className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-3">
                    <span className="text-xs font-bold theme-text uppercase tracking-wider">Change Password</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full theme-panel-bg border theme-border rounded-xl px-3.5 py-2 text-xs theme-text outline-none"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      className="w-full theme-panel-bg border theme-border rounded-xl px-3.5 py-2 text-xs theme-text outline-none"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full theme-panel-bg border theme-border rounded-xl px-3.5 py-2 text-xs theme-text outline-none"
                    />
                    <Button type="submit" loading={savingPassword} className="w-full py-2 theme-accent-bg text-white font-bold text-xs">
                      Update Password
                    </Button>
                  </form>

                  <div className="p-4 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold theme-text uppercase tracking-wider">Linked Devices ({sessions.length})</span>
                      {otherDevices.length > 0 && (
                        <button type="button" onClick={handleLogoutAllOther} className="text-xs text-red-500 font-bold hover:underline">
                          Log out all
                        </button>
                      )}
                    </div>
                    {sessions.map((session) => (
                      <div key={session.sessionId} className="p-2 rounded-xl theme-panel-bg border theme-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg theme-soft-bg flex items-center justify-center theme-text-muted">
                            {getDeviceIcon(session.os)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold theme-text">{session.deviceName}</span>
                            <span className="text-[9px] text-emerald-400 font-mono">{session.isCurrent ? "🟢 Active Now" : formatLastSeen(session.lastActive)}</span>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button onClick={() => handleLogoutSession(session.sessionId)} className="text-xs text-red-500 hover:underline">
                            Disconnect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TOOL 10: USER-DEFINED CHAT & ARCHIVE LOCK PIN */}
              {activeTab === "Chat Lock PIN" && (
                <div className="flex flex-col gap-4">
                  <form onSubmit={handleSavePin} className="flex flex-col gap-4">
                    <div className="p-3.5 rounded-2xl theme-accent-tint text-xs font-medium leading-relaxed flex flex-col gap-1.5">
                      <span className="font-bold flex items-center gap-1.5">
                        <FiLock /> Secret Vault & Chat Lock Passcode
                      </span>
                      <p className="opacity-90">
                        Set any 4 to 6 digit secret code of your choice. To open your hidden archive & locked chats, simply type{" "}
                        <strong className="font-mono text-amber-400 font-bold">${pin || activeUserPin || "YOURCODE"}</strong> in the Sidebar Search bar!
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold theme-text">
                          {activeUserPin ? "Update Secret Vault Code / PIN" : "Set New Secret Vault Code / PIN"}
                        </label>
                        {activeUserPin && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPinModal(true)}
                            className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <FiHelpCircle size={12} /> Forgot PIN?
                          </button>
                        )}
                      </div>

                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 font-mono text-lg font-bold text-amber-400 select-none">$</span>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 4-6 digit custom PIN"
                          className="w-full theme-soft-bg border theme-border rounded-xl pl-8 pr-4 py-2.5 text-xs theme-text outline-none font-mono text-lg tracking-widest theme-accent-focus transition"
                        />
                      </div>

                      {activeUserPin && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <FiCheckCircle size={11} /> Active Vault Code: ${activeUserPin} (Type in Search bar to open)
                        </span>
                      )}
                    </div>

                    <Button
                      type="submit"
                      loading={savingPin}
                      disabled={pin.length < 4}
                      className="w-full py-2.5 theme-accent-bg text-white font-bold text-xs shadow-md transition"
                    >
                      {activeUserPin ? "Update Secret PIN" : "Save Lock PIN"}
                    </Button>
                  </form>
                </div>
              )}

              {/* TOOL 11: VIP PRO SUITE */}
              {activeTab === "VIP Hub" && (
                <div className="flex flex-col gap-4">
                  <div className="p-5 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                        👑 KafChat VIP PRO Suite
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase">
                        {isVip ? "ACTIVE VIP PRO" : "FREE TIER"}
                      </span>
                    </div>

                    <ul className="text-xs theme-text flex flex-col gap-2 pt-1 font-medium">
                      <li className="flex items-center gap-2">✨ <strong>5 Profile Photos:</strong> Multi-DP stack unlocked</li>
                      <li className="flex items-center gap-2">💾 <strong>5 GB Storage:</strong> 10x cloud storage boost</li>
                      <li className="flex items-center gap-2">🎨 <strong>Luxury Colors & Fonts:</strong> Advanced theme styles</li>
                    </ul>

                    {!isVip ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPlanForPayment("MONTHLY")}
                          className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex flex-col items-center gap-1 hover:bg-amber-500/20 transition"
                        >
                          <span className="text-[10px] text-amber-400 font-bold uppercase">Monthly Pass</span>
                          <span className="text-base font-black text-white">₹99 <span className="text-[10px] font-normal text-gray-400">/mo</span></span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPlanForPayment("YEARLY")}
                          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-400/50 flex flex-col items-center gap-1 hover:opacity-90 transition relative overflow-hidden shadow-lg"
                        >
                          <span className="absolute top-1 right-1 text-[8px] bg-amber-400 text-black font-black px-1 rounded">SAVE 60%</span>
                          <span className="text-[10px] text-amber-300 font-bold uppercase">Annual VIP</span>
                          <span className="text-base font-black text-white">₹499 <span className="text-[10px] font-normal text-gray-400">/yr</span></span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs font-bold text-emerald-400 mt-2 flex items-center justify-center gap-2">
                        <FiCheckCircle size={15} /> Your VIP PRO Subscription is Active!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TOOL 12: DANGER ZONE */}
              {activeTab === "Account Lifecycle" && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col gap-2.5">
                    <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                      <FiLogOut /> Log Out from Current Device
                    </span>
                    <Button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to log out?")) {
                          await logout();
                          onClose();
                        }
                      }}
                      className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
                    >
                      Log Out
                    </Button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Forgot PIN Recovery Modal */}
      {showForgotPinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setShowForgotPinModal(false)}
        >
          <form
            onSubmit={handleResetPinWithPassword}
            className="w-full max-w-sm theme-panel-bg border border-amber-400/40 rounded-3xl p-6 shadow-2xl animate-bubbleIn flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b theme-border">
              <h4 className="text-sm font-bold theme-text flex items-center gap-2">
                <FiKey className="text-amber-400" /> Reset Secret PIN Passcode
              </h4>
              <button
                type="button"
                onClick={() => setShowForgotPinModal(false)}
                className="theme-text-muted hover:theme-text"
              >
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs theme-text-muted leading-relaxed">
              Enter your account login password to set a fresh custom code.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold theme-text">Account Password</label>
              <input
                type="password"
                value={accountPasswordForPinReset}
                onChange={(e) => setAccountPasswordForPinReset(e.target.value)}
                placeholder="Enter your login password"
                className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold theme-text">New Secret Code ($)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-base font-bold text-amber-400">$</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPinAfterReset}
                  onChange={(e) => setNewPinAfterReset(e.target.value.replace(/\D/g, ""))}
                  placeholder="New 4-6 digits"
                  className="w-full theme-soft-bg border theme-border rounded-xl pl-7 pr-3 py-2 text-xs theme-text outline-none font-mono text-base tracking-widest"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={resettingPin}
              className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs shadow-lg mt-1"
            >
              Verify Password & Reset PIN
            </Button>
          </form>
        </div>
      )}

      {/* Social Followers & Following List Modal */}
      {socialModalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setSocialModalType(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-5 shadow-2xl flex flex-col gap-3 max-h-[70vh] animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b theme-border">
              <div className="flex items-center gap-2">
                <FiUsers className="theme-accent-text" size={16} />
                <h4 className="text-xs font-bold theme-text uppercase tracking-wider">
                  {socialModalType === "followers" ? `Followers (${followersList.length})` : `Following (${followingList.length})`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalType(null)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 theme-text-muted" size={13} />
              <input
                type="text"
                value={socialSearch}
                onChange={(e) => setSocialSearch(e.target.value)}
                placeholder="Search usernames..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl theme-soft-bg border theme-border text-xs theme-text outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2 pt-1">
              {(socialModalType === "followers" ? followersList : followingList)
                .filter((u) => {
                  const name = (typeof u === "object" ? u.fullName : "").toLowerCase();
                  const username = (typeof u === "object" ? u.username : "").toLowerCase();
                  return name.includes(socialSearch.toLowerCase()) || username.includes(socialSearch.toLowerCase());
                })
                .map((u) => {
                  const itemUser = typeof u === "object" ? u : { _id: u, fullName: "User", username: "user" };
                  const isUserPrivate = Boolean(itemUser.isPrivateAccount);

                  return (
                    <div
                      key={itemUser._id}
                      onClick={() => {
                        setViewingProfileUser(itemUser);
                        setSocialModalType(null);
                      }}
                      className="p-2.5 rounded-2xl theme-soft-bg border theme-border flex items-center justify-between gap-2 cursor-pointer hover:theme-accent-tint transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={itemUser.avatar} alt={itemUser.fullName} size="sm" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold theme-text truncate">{itemUser.fullName}</span>
                            {itemUser.isVIP && (
                              <span className="text-[8px] bg-amber-500 text-black px-1 rounded-full font-black">
                                PRO
                              </span>
                            )}
                            {isUserPrivate && (
                              <FiLock size={10} className="text-amber-400 shrink-0" title="Private Account" />
                            )}
                          </div>
                          <span className="text-[10px] theme-accent-text font-mono truncate">@{itemUser.username}</span>
                        </div>
                      </div>

                      <span className="text-[10px] theme-accent-text font-bold uppercase tracking-wider">
                        View Profile
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Instagram-Style User Profile Inspector Modal */}
      {viewingProfileUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setViewingProfileUser(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-3 animate-bubbleIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewingProfileUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
            >
              <FiX size={18} />
            </button>

            <Avatar src={viewingProfileUser.avatar} alt={viewingProfileUser.fullName} size="xl" />

            <div className="flex flex-col items-center">
              <h3 className="text-sm font-bold theme-text flex items-center gap-1.5">
                {viewingProfileUser.fullName}
                {viewingProfileUser.isVIP && (
                  <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.2 rounded-full font-black">
                    PRO
                  </span>
                )}
              </h3>
              <span className="text-xs theme-accent-text font-mono">@{viewingProfileUser.username}</span>
            </div>

            {viewingProfileUser.bio && (
              <p className="text-xs theme-text-muted italic px-2">"{viewingProfileUser.bio}"</p>
            )}

            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <Button
                onClick={() => {
                  if (startChatWithUser && viewingProfileUser._id) {
                    startChatWithUser(viewingProfileUser._id);
                    setViewingProfileUser(null);
                    onClose();
                  }
                }}
                className="w-full py-2.5 theme-accent-bg text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <FiMessageSquare size={14} /> Message
              </Button>
              <Button
                type="button"
                onClick={() => setViewingProfileUser(null)}
                className="w-full py-2.5 theme-soft-bg theme-text font-semibold text-xs border theme-border"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Checkout Drawer */}
      {selectedPlanForPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setSelectedPlanForPayment(null)}
        >
          <div
            className="w-full max-w-sm theme-panel-bg border border-amber-400/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b theme-border">
              <div className="flex items-center gap-2">
                <FiCreditCard className="text-amber-400" size={18} />
                <h4 className="text-sm font-bold theme-text">Checkout VIP PRO Suite</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForPayment(null)}
                className="theme-text-muted hover:theme-text"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-1">
              <span className="text-xs font-bold text-amber-300">
                Plan: {selectedPlanForPayment === "MONTHLY" ? "Monthly Pass" : "Annual PRO Pass"}
              </span>
              <span className="text-xl font-black text-white">
                {selectedPlanForPayment === "MONTHLY" ? "₹99" : "₹499"}
              </span>
            </div>

            <Button
              onClick={handleProceedPayment}
              loading={processingPayment}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-xs shadow-lg"
            >
              Pay & Activate PRO
            </Button>
          </div>
        </div>
      )}

      <AvatarStudioModal isOpen={showAvatarStudio} onClose={() => setShowAvatarStudio(false)} />
    </>
  );
};

export default ProfileModal;