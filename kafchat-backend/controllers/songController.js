const Song = require("../models/Song");

// @desc Get all available tracks
// @route GET /api/songs
exports.getSongs = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search && search.trim()) {
      const q = search.trim();
      query = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { artist: { $regex: q, $options: "i" } },
        ],
      };
    }
    const songs = await Song.find(query).sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ success: true, songs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add a new track (Admin / Seed helper)
// @route POST /api/songs
exports.addSong = async (req, res) => {
  try {
    const { title, artist, audioUrl, duration, thumbnailUrl } = req.body;
    if (!title || !audioUrl) {
      return res.status(400).json({ success: false, message: "Title and Audio URL are required" });
    }
    const song = await Song.create({ title, artist, audioUrl, duration, thumbnailUrl });
    return res.status(201).json({ success: true, song });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};