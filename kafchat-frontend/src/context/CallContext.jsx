import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { getSocket } from "../services/socket";
import { createPeerConnection, getLocalMediaStream, stopMediaStream } from "../services/webrtc";
import api from "../services/api";

export const CallContext = createContext(null);

const initialCallState = {
  status: "idle", // "idle" | "ringing-outgoing" | "ringing-incoming" | "ongoing"
  callId: null,
  chatId: null,
  callType: "audio", // "audio" | "video"
  peer: null,
  startedAt: null,
};

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [call, setCall] = useState(initialCallState);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const pcRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const localStreamRef = useRef(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setCall(initialCallState);
  }, []);

  const setupPeerConnection = useCallback((toUserId) => {
    const pc = createPeerConnection({
      onIceCandidate: (candidate) => {
        getSocket()?.emit("call:ice-candidate", { toUserId, candidate });
      },
      onTrack: (stream) => setRemoteStream(stream),
      onConnectionStateChange: (state) => {
        if (state === "failed" || state === "disconnected") {
          toast.error("Call connection lost");
        }
      },
    });
    pcRef.current = pc;
    return pc;
  }, []);

  // Outgoing call
  const startCall = useCallback(
    async (peer, chatId, callType = "audio") => {
      if (!peer?._id) return;
      try {
        const stream = await getLocalMediaStream(callType);
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = setupPeerConnection(peer._id);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setCall({
          status: "ringing-outgoing",
          callId: null,
          chatId,
          callType,
          peer,
          startedAt: null,
        });

        getSocket()?.emit("call:invite", { toUserId: peer._id, chatId, callType, offer });
      } catch (err) {
        console.error("startCall error:", err);
        toast.error(
          err.name === "NotAllowedError"
            ? "Camera/microphone permission denied"
            : "Couldn't start the call"
        );
        cleanup();
      }
    },
    [setupPeerConnection, cleanup]
  );

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const offer = pendingOfferRef.current;
    if (!offer || !call.peer) return;

    try {
      const stream = await getLocalMediaStream(call.callType);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = setupPeerConnection(call.peer._id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getSocket()?.emit("call:answer", { toUserId: call.peer._id, callId: call.callId, answer });

      setCall((prev) => ({ ...prev, status: "ongoing", startedAt: Date.now() }));
    } catch (err) {
      console.error("acceptCall error:", err);
      toast.error(
        err.name === "NotAllowedError"
          ? "Camera/microphone permission denied"
          : "Couldn't join the call"
      );
      if (call.peer) {
        getSocket()?.emit("call:reject", { toUserId: call.peer._id, callId: call.callId });
      }
      cleanup();
    }
  }, [call, setupPeerConnection, cleanup]);

  const rejectCall = useCallback(() => {
    if (call.peer) {
      getSocket()?.emit("call:reject", { toUserId: call.peer._id, callId: call.callId });
    }
    cleanup();
  }, [call, cleanup]);

  const endCall = useCallback(() => {
    if (call.peer) {
      getSocket()?.emit("call:end", { toUserId: call.peer._id, callId: call.callId });
    }
    cleanup();
  }, [call, cleanup]);

  // Local media controls
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted((m) => !m);
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
    setIsVideoOff((v) => !v);
  }, [isVideoOff]);

  // Guarded Remote Session Handlers (PRO Feature)
  const createRemotePin = useCallback(async (peerId) => {
    try {
      const { data } = await api.post("/devices/remote-pin", { peerId });
      return data.pin;
    } catch {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }, []);

  const verifyRemotePin = useCallback(async (callId, pin) => {
    const { data } = await api.post("/devices/verify-remote-pin", { callId, pin });
    return data;
  }, []);

  const killRemoteAccess = useCallback(async (callId) => {
    getSocket()?.emit("trigger_remote_kill", { targetDeviceId: callId });
    return true;
  }, []);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const onIncoming = ({ callId, chatId, callType, offer, fromUser }) => {
      if (call.status !== "idle") {
        socket.emit("call:reject", { toUserId: fromUser._id, callId });
        return;
      }
      pendingOfferRef.current = offer;
      setCall({
        status: "ringing-incoming",
        callId,
        chatId,
        callType,
        peer: fromUser,
        startedAt: null,
      });
    };

    const onAnswered = async ({ answer }) => {
      try {
        await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setCall((prev) => ({ ...prev, status: "ongoing", startedAt: Date.now() }));
      } catch (err) {
        console.error("Failed to set remote description:", err);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    };

    const onRejected = () => {
      toast.error(`${call.peer?.fullName || "They"} declined the call`);
      cleanup();
    };

    const onEnded = () => {
      cleanup();
    };

    const onBusy = () => {
      toast.error("User is on another call");
      cleanup();
    };

    const onUnavailable = () => {
      toast.error("User is currently offline");
      cleanup();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:answered", onAnswered);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);
    socket.on("call:busy", onBusy);
    socket.on("call:unavailable", onUnavailable);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:answered", onAnswered);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
      socket.off("call:busy", onBusy);
      socket.off("call:unavailable", onUnavailable);
    };
  }, [user, call.status, call.peer, cleanup]);

  const value = {
    call,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    createRemotePin,
    verifyRemotePin,
    killRemoteAccess,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};