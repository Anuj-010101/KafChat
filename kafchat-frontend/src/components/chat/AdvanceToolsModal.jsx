import { useState } from "react";
import { FiClock, FiX, FiCheck, FiShield } from "react-icons/fi";
import api from "../../services/api";
import { useChat } from "../../hooks/useChat";
import toast from "react-hot-toast";

const TIMER_OPTIONS = [
  { id: "off", label: "Off", desc: "Messages will remain in chat history (Standard mode)" },
  { id: "after_view", label: "Auto-delete After Viewing ⚡", desc: "Messages disappear automatically once viewed and closed" },
  { id: "24h", label: "24 Hours", desc: "Messages auto-delete 24 hours after being sent" },
  { id: "7d", label: "7 Days", desc: "Messages auto-delete 7 days after being sent" },
  { id: "90d", label: "90 Days", desc: "Messages auto-delete 90 days after being sent" },
];

const AdvanceToolsModal = ({ isOpen, onClose }) => {
  const { activeChat, setActiveChat, fetchChats } = useChat();
  const [selectedTimer, setSelectedTimer] = useState(activeChat?.disappearingTimer || "off");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !activeChat) return null;

  const handleUpdateTimer = async (timerId) => {
    try {
      setLoading(true);
      setSelectedTimer(timerId);
      const { data } = await api.patch(`/chats/${activeChat._id}/disappearing`, { timer: timerId });
      if (data.success) {
        const displayLabel = timerId === "after_view" ? "Auto-delete after view" : timerId === "off" ? "Off" : timerId;
        toast.success(`Message timer set to ${displayLabel}`);
        if (setActiveChat) setActiveChat(data.chat);
        if (fetchChats) fetchChats();
      }
    } catch {
      toast.error("Failed to update disappearing timer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md theme-panel-bg border theme-border rounded-3xl p-5 sm:p-6 shadow-2xl animate-bubbleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b theme-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl theme-accent-tint flex items-center justify-center font-bold text-sm">
              <FiShield className="theme-accent-text" size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold theme-text">Advanced Chat Tools</h3>
              <p className="text-[11px] theme-text-muted">Advanced Privacy & Security Controls</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full theme-text-muted hover:theme-text hover:theme-soft-bg transition"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold theme-accent-text flex items-center gap-1.5">
            <FiClock /> Disappearing Messages Mode
          </span>
          <p className="text-[11px] theme-text-muted leading-relaxed">
            When enabled, all new messages sent in this conversation will auto-expire based on your selected duration for all participants.
          </p>

          <div className="flex flex-col gap-2 mt-1">
            {TIMER_OPTIONS.map((opt) => {
              const isSelected = selectedTimer === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdateTimer(opt.id)}
                  className={`p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition ${
                    isSelected
                      ? "theme-accent-tint border-sky-400 font-semibold shadow-sm"
                      : "theme-soft-bg theme-border hover:opacity-90"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs theme-text flex items-center gap-1.5">
                      {opt.label}
                      {opt.id === "after_view" && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                          AUTO-DELETE
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] theme-text-muted mt-0.5">{opt.desc}</span>
                  </div>
                  {isSelected && <FiCheck className="theme-accent-text shrink-0 mt-0.5" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl theme-accent-bg text-white font-semibold text-xs shadow transition mt-2 hover:opacity-95"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default AdvanceToolsModal;