import { useState, useEffect } from "react";
import {
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiLogOut,
  FiX,
  FiShield,
  FiRefreshCw
} from "react-icons/fi";
import { authService } from "../../services/authService";
import { formatLastSeen } from "../../utils/formatTime";
import toast from "react-hot-toast";

const LinkedDevicesModal = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await authService.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      toast.error("Failed to load linked devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSessions();
  }, [isOpen]);

  const handleLogoutSession = async (sessionId) => {
    try {
      await authService.logoutSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      toast.success("Device logged out remotely");
    } catch (err) {
      toast.error("Failed to logout device");
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      await authService.logoutAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success("Logged out of all other devices");
    } catch (err) {
      toast.error("Failed to logout other devices");
    }
  };

  const getDeviceIcon = (os = "") => {
    const lower = os.toLowerCase();
    if (lower.includes("android") || lower.includes("ios") || lower.includes("phone")) {
      return <FiSmartphone size={18} />;
    }
    if (lower.includes("ipad") || lower.includes("tablet")) {
      return <FiTablet size={18} />;
    }
    return <FiMonitor size={18} />;
  };

  if (!isOpen) return null;

  const currentDevice = sessions.find((s) => s.isCurrent);
  const otherDevices = sessions.filter((s) => !s.isCurrent);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-bubbleIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#181a20] border border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-black/20">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FiShield className="text-sky-400" /> Linked Devices
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="Refresh"
            >
              <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-5">
          {/* Info Banner */}
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300">
            Use KafChat on all your computers, phones, and tablets at once without disconnecting.
          </div>

          {/* Current Device Card */}
          {currentDevice && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                This Device
              </span>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    {getDeviceIcon(currentDevice.os)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">
                      {currentDevice.deviceName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      🟢 Active Now (Current)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Devices Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Other Active Devices ({otherDevices.length})
              </span>
              {otherDevices.length > 0 && (
                <button
                  onClick={handleLogoutAllOther}
                  className="text-xs text-red-400 hover:underline font-medium"
                >
                  Log out all
                </button>
              )}
            </div>

            {otherDevices.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">
                No other devices currently logged into your account.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {otherDevices.map((session) => (
                  <div
                    key={session.sessionId}
                    className="p-3 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-between hover:border-gray-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gray-800 text-gray-300 flex items-center justify-center shrink-0">
                        {getDeviceIcon(session.os)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-white truncate">
                          {session.deviceName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Last active: {formatLastSeen(session.lastActive)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLogoutSession(session.sessionId)}
                      className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center gap-1 transition"
                      title="Remote Log Out"
                    >
                      <FiLogOut size={13} /> Log out
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedDevicesModal;