import { useState, useEffect, useRef } from "react";
import { FiX, FiMusic, FiPlay, FiPause } from "react-icons/fi";
import { songService } from "../../services/songService";

const FALLBACK_TRACKS = [
  {
    _id: "1",
    title: "Lo-Fi Chill",
    artist: "AudioLibrary",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf756.mp3?filename=lofi-study-112191.mp3",
  },
  {
    _id: "2",
    title: "Summer Upbeat",
    artist: "Pixabay",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c3a50462.mp3?filename=corporate-upbeat-105151.mp3",
  },
  {
    _id: "3",
    title: "Happy Acoustic",
    artist: "FMA",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=happy-acoustic-guitar-10023.mp3",
  },
];

const MusicPickerModal = ({ onClose, onSelectSong }) => {
  const [search, setSearch] = useState("");
  const [tracks, setTracks] = useState(FALLBACK_TRACKS);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const { data } = await songService.getSongs(search);
        if (data?.success && data.songs?.length > 0) {
          setTracks(data.songs);
        }
      } catch (err) {
        console.warn("Using fallback tracks:", err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchTracks, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Audio Preview Play/Pause
  const togglePlayPreview = (e, track) => {
    e.stopPropagation(); // Prevent selecting the song while clicking preview
    
    if (playingId === track._id || playingId === track.title) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;
      audio.play().catch((err) => console.error("Audio playback blocked:", err));
      
      audio.onended = () => setPlayingId(null);
      setPlayingId(track._id || track.title);
    }
  };

  // Cleanup audio on modal close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[420px] animate-bubbleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <FiMusic className="text-pink-400" /> Select Music Track
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <FiX size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-800 bg-slate-900">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs or artists..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 outline-none focus:border-pink-500 font-medium"
            autoFocus
          />
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-6">Loading tracks...</p>
          ) : tracks.length > 0 ? (
            tracks.map((track) => {
              const isPlaying = playingId === (track._id || track.title);
              return (
                <div
                  key={track._id || track.title}
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    onSelectSong({
                      title: track.title,
                      artist: track.artist,
                      audioUrl: track.audioUrl,
                    });
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 cursor-pointer transition border border-slate-800 group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold text-white truncate">{track.title}</span>
                    <span className="text-[10px] text-slate-400 truncate">{track.artist}</span>
                  </div>
                  
                  {/* Play/Pause Preview Button */}
                  <button
                    onClick={(e) => togglePlayPreview(e, track)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition shrink-0 ${
                      isPlaying 
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/40" 
                        : "bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
                    }`}
                  >
                    {isPlaying ? <FiPause size={12} /> : <FiPlay size={12} className="ml-0.5" />}
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No songs found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicPickerModal;