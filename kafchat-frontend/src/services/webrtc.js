// Public STUN servers — sufficient for most NATs. For production behind
// strict corporate NATs/firewalls, add a TURN server (e.g. coturn, Twilio
// Network Traversal) to the iceServers list below.
export const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const createPeerConnection = ({ onIceCandidate, onTrack, onConnectionStateChange }) => {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onicecandidate = (event) => {
    if (event.candidate) onIceCandidate(event.candidate);
  };

  pc.ontrack = (event) => {
    onTrack(event.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    onConnectionStateChange?.(pc.connectionState);
  };

  return pc;
};

export const getLocalMediaStream = async (callType) => {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === "video" ? { width: 640, height: 480 } : false,
  });
};

export const stopMediaStream = (stream) => {
  stream?.getTracks().forEach((track) => track.stop());
};
