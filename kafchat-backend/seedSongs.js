const mongoose = require("mongoose");
const Song = require("./models/Song");
const songsData = require("./data/songs.json"); // <-- JSON file yahan import ki
require("dotenv").config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for bulk seeding...");

    // Optional: Purane duplicate songs hatane ke liye
    await Song.deleteMany({});
    
    // JSON ka sara data ek sath database me insert ho jayega
    await Song.insertMany(songsData);
    console.log(`Successfully added ${songsData.length} songs from JSON! 🎵`);

    process.exit();
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedDB();