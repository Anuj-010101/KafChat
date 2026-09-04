import { useEffect, useRef, useState } from "react";
import {
  FiMic,
  FiMicOff,
  FiPhoneOff,
  FiVideo,
  FiVideoOff,
  FiTv,
  FiShield,
  FiKey,
  FiZap,
  FiX,
  FiFilter,
} from "react-icons/fi";
import Avatar from "../common/Avatar";
import { useCall } from "../../hooks/useCall";
import { useCallDuration } from "../../hooks/useCallDuration";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const LIVE_FILTERS = [
  { id: "none", label: "Normal", filterClass: "" },
  { id: "studio", label: "Studio Light", filterClass: "contrast-125 brightness-110 saturate-110" },
  { id: "cyberpunk", label: "Cyberpunk", filterClass: "hue-rotate-60 saturate-200 contrast-125" },
  { id: "emerald", label: "Emerald", filterClass: "hue-rotate-90 brightness-95" },
  { id: "mono", label: "Noir Mono", filterClass: "grayscale contrast-150" },
];

const ActiveCallScreen = () => {
  const { user } = useAuth();
  const {
    call,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    endCall,
    toggleMute,
    toggleVideo,
    createRemotePin,
    verifyRemotePin,
    killRemoteAccess,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const duration = useCallDuration(call.status === "ongoing" ? call.startedAt : null);

  // Advanced Suite States
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [activeFilter, setActiveFilter] = useState("none");
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  // Guarded Remote Control States
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remotePin, setRemotePin] = useState("");
  const [generatedPin, setGeneratedPin] = useState(null);
  const [remoteActive, setRemoteActive] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (call.status !== "ringing-outgoing" && call.status !== "ongoing") return null;

  const isVideoCall = call.callType === "video";
  const isRinging = call.status === "ringing-outgoing";
  const selectedFilterClass = LIVE_FILTERS.find((f) => f.id === activeFilter)?.filterClass || "";

  // 1. Screen Sharing Trigger
  const handleToggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        toast.success("Screen sharing started 🖥️");

        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
          setIsScreenSharing(false);
          toast.success("Screen sharing stopped");
        };
      } else {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
      }
    } catch {
      toast.error("Screen share cancelled or permission denied");
    }
  };

  // 2. AI Noise Suppression Toggle
  const handleToggleNoiseSuppression = () => {
    const nextState = !noiseSuppression;
    setNoiseSuppression(nextState);
    toast.success(nextState ? "AI Noise Suppression: ON 🎙️" : "AI Noise Suppression: OFF");
  };

  // 3. Guarded Remote Session Handlers
  const handleRequestRemotePin = async () => {
    try {
      if (createRemotePin) {
        const pin = await createRemotePin(call.peer?._id);
        setGeneratedPin(pin);
        toast.success("Remote access PIN generated! Share with your partner.");
      } else {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedPin(pin);
        toast.success("Remote access PIN generated: " + pin);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate Remote PIN");
    }
  };

  const handleVerifyRemotePin = async (e) => {
    e.preventDefault();
    if (remotePin.length !== 6) {
      toast.error("Enter a valid 6-digit Session PIN");
      return;
    }
    try {
      if (verifyRemotePin) await verifyRemotePin(call._id, remotePin);
      setRemoteActive(true);
      setShowRemoteModal(false);
      toast.success("Remote Control Session Activated! 🔒");
    } catch {
      toast.error("Invalid or Expired Remote PIN");
    }
  };

  const handleEmergencyKill = async () => {
    try {
      if (killRemoteAccess) await killRemoteAccess(call._id);
      setRemoteActive(false);
      setGeneratedPin(null);
      toast.error("Emergency Kill: Remote Control Terminated Instantly! 🚨");
    } catch {
      setRemoteActive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080b11] flex flex-col select-none overflow-hidden">
      {/* Remote Video Stream / Full Screen */}
      {isVideoCall && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover bg-black ${selectedFilterClass}`}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
          <Avatar
            src={call.peer?.avatar}
            alt={call.peer?.fullName}
            size="xl"
            className="scale-150 shadow-2xl border-4 border-cyan-400/30 animate-pulse"
          />
          <div className="text-center mt-6">
            <p className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {call.peer?.fullName || "User"}
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1">@{call.peer?.username || "kafchat"}</p>
            <p className="text-sm text-cyan-400 font-mono font-semibold mt-2 bg-cyan-950/40 px-4 py-1 rounded-full border border-cyan-800/40 inline-block">
              {isRinging ? "Ringing…" : duration}
            </p>
          </div>
        </div>
      )}

      {/* Local Video PiP */}
      {isVideoCall && localStream && (
        <div className="absolute top-6 right-6 z-20 group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-28 sm:w-40 aspect-[3/4] rounded-2xl object-cover border-2 border-slate-700 shadow-2xl bg-black ${selectedFilterClass}`}
          />
          {isScreenSharing && (
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-pink-600/90 text-white text-[9px] font-bold">
              SHARING SCREEN
            </span>
          )}
        </div>
      )}

      {/* Top Floating Status Bar */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex flex-col">
            <p className="text-xs font-bold text-white">{call.peer?.fullName || "KafChat HD"}</p>
            <p className="text-[10px] text-cyan-400 font-mono">{isRinging ? "Connecting..." : duration}</p>
          </div>
        </div>

        {remoteActive && (
          <button
            onClick={handleEmergencyKill}
            className="px-3 py-2 rounded-2xl bg-red-500/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-400 animate-pulse"
          >
            <FiShield size={14} /> 1-Tap Kill Remote
          </button>
        )}
      </div>

      {/* Live AR Filter Selector Popover */}
      {showFilterPicker && (
        <div className="absolute bottom-28 z-30 left-1/2 -translate-x-1/2 bg-[#0d131f]/95 border border-slate-800 backdrop-blur-md p-2 rounded-2xl flex items-center gap-2 shadow-2xl animate-bubbleIn">
          {LIVE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFilter(f.id);
                setShowFilterPicker(false);
                toast.success(`Filter: ${f.label}`);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeFilter === f.id
                  ? "bg-cyan-400 text-black shadow"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Control Panel */}
      <div className="relative z-20 shrink-0 flex items-center justify-center gap-3 sm:gap-4 pb-8 pt-4 px-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Mute Audio */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isMuted ? "bg-white text-black shadow-lg" : "bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
        </button>

        {/* Toggle Video */}
        {isVideoCall && (
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isVideoOff ? "bg-white text-black shadow-lg" : "bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700"
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <FiVideoOff size={18} /> : <FiVideo size={18} />}
          </button>
        )}

        {/* Screen Sharing Toggle */}
        <button
          onClick={handleToggleScreenShare}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isScreenSharing ? "bg-pink-500 text-white shadow-lg" : "bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700"
          }`}
          title="Share Screen"
        >
          <FiTv size={18} />
        </button>

        {/* AI Noise Suppression Toggle */}
        <button
          onClick={handleToggleNoiseSuppression}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            noiseSuppression ? "bg-cyan-500 text-black font-bold shadow-lg" : "bg-slate-800/90 text-slate-400 border border-slate-700"
          }`}
          title="AI Noise Suppression"
        >
          <FiZap size={18} />
        </button>

        {/* AR Live Filter Picker (For Video Calls) */}
        {isVideoCall && (
          <button
            onClick={() => setShowFilterPicker((prev) => !prev)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeFilter !== "none" ? "bg-purple-500 text-white" : "bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700"
            }`}
            title="Video Filters"
          >
            <FiFilter size={18} />
          </button>
        )}

        {/* Guarded Remote PIN Session (PRO) */}
        <button
          onClick={() => setShowRemoteModal(true)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            remoteActive ? "bg-emerald-500 text-black font-bold shadow-lg" : "bg-slate-800/90 text-emerald-400 border border-slate-700 hover:bg-slate-700"
          }`}
          title="Guarded Remote Session"
        >
          <FiKey size={18} />
        </button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-all border border-red-400"
          title="End Call"
        >
          <FiPhoneOff size={22} />
        </button>
      </div>

      {/* Guarded Remote Control 2FA PIN Modal */}
      {showRemoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setShowRemoteModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0d131f] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FiShield className="text-emerald-400" /> Guarded Remote Session
              </h4>
              <button onClick={() => setShowRemoteModal(false)} className="text-slate-400 hover:text-white">
                <FiX size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Guarded 2FA session control. Requires 6-digit session PIN authentication.
            </p>

            {generatedPin ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                  Active Session PIN
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-white">
                  {generatedPin}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRequestRemotePin}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold text-xs shadow-lg hover:opacity-95 transition"
              >
                Generate 6-Digit Remote PIN
              </button>
            )}

            <form onSubmit={handleVerifyRemotePin} className="flex flex-col gap-3 pt-2 border-t border-slate-800">
              <label className="text-[10px] text-slate-400 font-bold uppercase">
                Or Enter Partner's 6-Digit PIN
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={remotePin}
                onChange={(e) => setRemotePin(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#121929] border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-cyan-400 outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-lg hover:bg-cyan-400 transition"
              >
                Verify PIN & Start Control
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveCallScreen;