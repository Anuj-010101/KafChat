import { FiPhone, FiPhoneOff, FiVideo, FiShield } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { useCall } from "../../hooks/useCall";

const IncomingCallModal = () => {
  const { call, acceptCall, rejectCall } = useCall();

  if (call.status !== "ringing-incoming") return null;

  const isVideo = call.callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-6 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-[#0d131f] border border-[#1c2842] rounded-[32px] shadow-2xl p-8 flex flex-col items-center gap-6 animate-bubbleIn relative overflow-hidden">
        {/* Animated Background Ring */}
        <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-[10px] font-bold tracking-wider uppercase">
          <FiShield size={11} /> End-to-End Encrypted {call.callType} Call
        </div>

        <div className="relative">
          <Avatar
            src={call.peer?.avatar}
            alt={call.peer?.fullName}
            size="xl"
            className="scale-125 border-4 border-cyan-400/40 shadow-2xl"
          />
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-cyan-400">
            {isVideo ? <FiVideo size={13} /> : <FiPhone size={13} />}
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {call.peer?.fullName || "Incoming Call"}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            @{call.peer?.username || "kafchat_user"}
          </p>
        </div>

        {/* Accept & Reject Action Buttons */}
        <div className="flex items-center gap-8 mt-2">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={rejectCall}
              className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all border border-red-400"
              aria-label="Decline call"
            >
              <FiPhoneOff size={22} />
            </button>
            <span className="text-[10px] text-slate-400 font-semibold">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 flex items-center justify-center text-black shadow-xl hover:scale-110 active:scale-95 transition-all border border-cyan-300 animate-bounce"
              aria-label="Accept call"
            >
              {isVideo ? <FiVideo size={22} /> : <FiPhone size={22} />}
            </button>
            <span className="text-[10px] text-cyan-400 font-semibold">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;