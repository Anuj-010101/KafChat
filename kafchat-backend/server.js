require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const callRoutes = require("./routes/callRoutes");
const statusRoutes = require("./routes/statusRoutes");
const socialRoutes = require("./routes/socialRoutes");
const reelRoutes = require("./routes/reelRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const streakRoutes = require("./routes/streakRoutes");
const songRoutes = require("./routes/songRoutes"); // ✅ Added song routes

// Controllers & Sockets
const { handleAIChatAssistant } = require("./controllers/aiController");
const { initSocket } = require("./socket/chatSocket");
const { protect } = require("./middleware/authMiddleware");

// Initialize Database Connection
connectDB();

const app = express();

// 1. Dynamic CORS Configuration (Allows Localhost + Any Local Network IP)
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  })
);

// 2. High-Capacity Payload Parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 3. Static Uploads Serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. Health Check Endpoint
app.get("/api/health", (req, res) =>
  res.status(200).json({ status: "ok", app: "KafChat Master System" })
);

// 5. API Route Registrations
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/streaks", streakRoutes);
app.use("/api/songs", songRoutes); // ✅ Registered song routes here

// In-Chat AI Assistant Route
app.post("/api/ai/ask", protect, handleAIChatAssistant);

// 6. 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// 8. HTTP & Socket.IO Server Setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ["GET", "POST"],
    credentials: true,
  },
  maxHttpBufferSize: 1e8, // 100 MB Limit
});

// Initialize Master Socket Engine
initSocket(io);

const PORT = process.env.PORT || 5000;

// ✅ Single clean listener on 0.0.0.0
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 KafChat Master Server running on port ${PORT} across all network interfaces`);
});