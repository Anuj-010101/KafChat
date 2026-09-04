const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "kafchat_master_secret");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Check if the current session was revoked/logged out remotely
    if (decoded.sessionId && user.sessions) {
      const isValidSession = user.sessions.some((s) => s.sessionId === decoded.sessionId);
      if (!isValidSession) {
        return res.status(401).json({
          success: false,
          message: "Session expired or logged out remotely",
          sessionRevoked: true,
        });
      }
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token invalid" });
  }
};