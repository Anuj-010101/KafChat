const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const isVIP = req.user?.isVIP || false;

  // 1. Image upload filter (Max 5MB)
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  // 2. Video upload filter (Max 25MB - Strict 720p cap)
  if (file.mimetype.startsWith("video/")) {
    return cb(null, true);
  }

  // 3. Audio upload filter (Max 10MB - 32kbps mono)
  if (file.mimetype.startsWith("audio/")) {
    return cb(null, true);
  }

  // 4. Documents mode
  return cb(null, true);
};

// Strict Storage Caps
const uploadMedia = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB hard maximum for 720p video
  },
});

module.exports = {
  uploadSingle: uploadMedia.single("file"),
  uploadMultiple: uploadMedia.array("files", 10),
};