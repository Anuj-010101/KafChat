import { io } from "socket.io-client";

let socket = null;

const getSocketUrl = () => {
  if (typeof window !== "undefined" && window.location) {
    return `http://${window.location.hostname}:5000`;
  }
  return "http://localhost:5000";
};

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

  // 👉 Is line ko yahan add kar dein taaki window.socket hamesha available rahe
  if (typeof window !== "undefined") {
    window.socket = socket;
  }

  socket.on("connect", () => {
    console.log("⚡ Socket connected successfully:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  return socket;
};

export const initSocket = (token) => connectSocket(token);

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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    if (typeof window !== "undefined") {
      window.socket = null;
    }
  }
};

export default {
  connectSocket,
  initSocket,
  getSocket,
  disconnectSocket,
};