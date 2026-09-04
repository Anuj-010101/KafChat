import { useState, useRef } from "react";
import { FiX, FiVideo, FiUploadCloud, FiMusic, FiSliders, FiCheck } from "react-icons/fi";
import Button from "../common/Button";
import { useReels } from "../../hooks/useReels";
import MusicPickerModal from "../status/MusicPickerModal";
import toast from "react-hot-toast";

const VIDEO_FILTERS = [
  { id: "normal", name: "Normal", className: "" },
  { id: "clarendon", name: "Clarendon", className: "contrast-125 brightness-110 saturate-150" },
  { id: "gingham", name: "Gingham", className: "sepia-25 brightness-105" },
  { id: "moon", name: "Moon", className: "grayscale contrast-125" },
  { id: "lark", name: "Lark", className: "contrast-90 saturate-125" },
];

const CreateReelModal = ({ onClose }) => {
  const { postReel } = useReels();
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [attachedAudio, setAttachedAudio] = useState(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file");
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePublish = async () => {
    if (!videoFile && !videoPreviewUrl) {
      toast.error("Please upload a video file for your reel");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append("file", videoFile);
      }
      formData.append("caption", caption.trim());
      formData.append("filter", selectedFilter);
      if (attachedAudio) {
        formData.append("audioTitle", attachedAudio.title);
        formData.append("audioArtist", attachedAudio.artist);
        formData.append("audioUrl", attachedAudio.audioUrl || "");
      }

      const success = await postReel(formData);
      if (success) {
        onClose();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 select-none animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[620px] animate-bubbleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FiVideo className="text-cyan-400" /> Create New Reel
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMusicModal(true)}
              className={`p-2 rounded-full transition ${attachedAudio ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-300 hover:text-white"}`}
              title="Add Audio Track"
            >
              <FiMusic size={16} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />

          {videoPreviewUrl ? (
            <div className="relative flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              <video
                src={videoPreviewUrl}
                autoPlay
                loop
                playsInline
                muted
                className={`w-full h-full object-cover ${VIDEO_FILTERS.find((f) => f.id === selectedFilter)?.className || ""}`}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition hover:bg-black"
              >
                Change Video
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-400 cursor-pointer flex flex-col items-center justify-center gap-3 bg-slate-950/50 transition p-4 text-center"
            >
              <FiUploadCloud size={40} className="text-cyan-400 animate-bounce" />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-white">Click to upload reel video (9:16)</p>
                <span className="text-[10px] text-slate-400">Supports MP4, MOV, WebM up to 200MB</span>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FiSliders size={12} /> Apply Filter Preset
            </span>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {VIDEO_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    selectedFilter === filter.id
                      ? "bg-cyan-500 text-black border-cyan-400 shadow-md"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>

          {/* Attached Audio Display */}
          {attachedAudio && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">
              <span className="truncate">🎵 Audio: {attachedAudio.title} - {attachedAudio.artist}</span>
              <button onClick={() => setAttachedAudio(null)} className="text-slate-400 hover:text-red-400">
                <FiX size={14} />
              </button>
            </div>
          )}

          {/* Caption Input */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 300))}
            placeholder="Write a caption or add hashtags (#coding #reel)..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 resize-none"
          />

          <Button onClick={handlePublish} loading={uploading} disabled={!videoPreviewUrl} className="w-full py-2.5 text-xs font-bold rounded-xl">
            Share Reel 🚀
          </Button>
        </div>

        {/* Music Picker Modal Integration */}
        {showMusicModal && (
          <MusicPickerModal
            onClose={() => setShowMusicModal(false)}
            onSelectSong={(song) => setAttachedAudio(song)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateReelModal;