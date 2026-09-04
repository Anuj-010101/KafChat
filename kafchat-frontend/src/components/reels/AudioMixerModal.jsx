import { useState } from "react";
import { FiX, FiMusic, FiVolume2, FiVolumeX, FiSliders } from "react-icons/fi";
import Button from "../common/Button";

const POPULAR_TRACKS = [
  { title: "Midnight City", artist: "M83", audioUrl: "https://example.com/track1.mp3" },
  { title: "Starboy", artist: "The Weeknd", audioUrl: "https://example.com/track2.mp3" },
  { title: "Blinding Lights", artist: "The Weeknd", audioUrl: "https://example.com/track3.mp3" },
];

const AudioMixerModal = ({ onClose, selectedAudio, onUpdateAudio }) => {
  const [track, setTrack] = useState(selectedAudio || POPULAR_TRACKS[0]);
  const [musicVolume, setMusicVolume] = useState(80);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(20);
  const [isMuted, setIsMuted] = useState(false);

  const handleSave = () => {
    onUpdateAudio({
      ...track,
      volume: musicVolume,
      originalVolume: originalAudioVolume,
      isMuted,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-bubbleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FiSliders className="text-pink-400" /> Audio Mixer & Volume
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <FiX size={18} />
          </button>
        </div>

        {/* Body Controls */}
        <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto">
          {/* Selected Track Info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <FiMusic size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{track.title}</span>
                <span className="text-[10px] text-slate-400">{track.artist}</span>
              </div>
            </div>
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className={`p-2 rounded-xl transition ${isMuted ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-300"}`}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>
          </div>

          {/* Background Music Volume Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Background Music Volume</span>
              <span className="font-mono text-pink-400">{musicVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>

          {/* Original Video Sound Volume Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Original Video Audio</span>
              <span className="font-mono text-cyan-400">{originalAudioVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={originalAudioVolume}
              onChange={(e) => setOriginalAudioVolume(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="mt-auto">
            <Button onClick={handleSave} className="w-full py-2.5 text-xs font-bold rounded-xl">
              Apply Audio Settings 🎵
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioMixerModal;