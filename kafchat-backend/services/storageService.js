const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Process Single File & Return Clean URL
const processFileUpload = async (file, req) => {
  if (!file) return null;

  const serverUrl = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
  return {
    fileUrl: serverUrl,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storageType: "local",
    localPath: file.path,
  };
};

// Delete File from Storage (Used by 24h Purge Engine)
const deleteFileFromStorage = async (fileUrlOrPath) => {
  try {
    if (!fileUrlOrPath) return;

    let filename = fileUrlOrPath;
    if (fileUrlOrPath.startsWith("http")) {
      filename = fileUrlOrPath.split("/uploads/")[1];
    }

    if (!filename) return;
    const fullPath = path.join(uploadDir, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Storage Purge] Deleted: ${filename}`);
    }
  } catch (error) {
    console.error("[Storage Purge Error]:", error.message);
  }
};

module.exports = {
  processFileUpload,
  deleteFileFromStorage,
};