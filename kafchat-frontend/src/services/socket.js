import { io } from "socket.io-client";

let socket = null;

// Dynamic URL: Mobile aur Laptop dono ke IP ko auto-detect karega
const getSocketUrl = () => {
  if (typeof window !== "undefined" && window.location) {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

// 1. connectSocket (Jo AuthContext.jsx expect kar raha hai)
export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  const authToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("kafchat_token")
      : null);

  socket = io(getSocketUrl(), {
    auth: { token: authToken },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("⚡ Socket connected successfully:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  return socket;
};

// 2. initSocket (Alias for connectSocket)
export const initSocket = (token) => connectSocket(token);

// 3. getSocket (Used in CallContext.js / ChatContext.js)
export const getSocket = () => {
  if (!socket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("kafchat_token")
        : null;
    return connectSocket(token);
  }
  return socket;
};

// 4. disconnectSocket (Used on Logout)
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  connectSocket,
  initSocket,
  getSocket,
  disconnectSocket,
};