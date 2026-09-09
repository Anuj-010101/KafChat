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
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/")
  ) {
    return cb(null, true);
  }
  return cb(null, true);
};

const uploadMedia = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB Limit
  },
});

module.exports = {
  uploadSingle: uploadMedia.single("media"), // ✅ Field name matches frontend FormData
  uploadMultiple: uploadMedia.array("files", 10),
};