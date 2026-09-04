import { useState, useRef } from "react";
import { FiX, FiType, FiImage, FiCheck, FiSmile, FiSliders } from "react-icons/fi";
import Button from "../common/Button";
import { useStatus } from "../../hooks/useStatus";
import toast from "react-hot-toast";

const STORY_GRADIENTS = [
  "from-sky-500 to-indigo-600",
  "from-pink-500 to-purple-600",
  "from-amber-500 to-rose-600",
  "from-emerald-500 to-teal-700",
  "from-slate-900 to-slate-950",
];

const StoryStudio = ({ onClose }) => {
  const { postStatus } = useStatus();
  const [activeTab, setActiveTab] = useState("text"); // "text" | "media"
  const [textContent, setTextContent] = useState("");
  const [gradientBg, setGradientBg] = useState(STORY_GRADIENTS[0]);
  const [mediaDataUrl, setMediaDataUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaDataUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (activeTab === "text" && !textContent.trim()) {
      toast.error("Please enter text for your story");
      return;
    }
    if (activeTab === "media" && !mediaDataUrl) {
      toast.error("Please select an image or media file");
      return;
    }

    setPosting(true);
    try {
      if (activeTab === "text") {
        await postStatus({
          mediaType: "text",
          text: textContent.trim(),
          backgroundColor: gradientBg,
        });
      } else {
        await postStatus({
          mediaType: "image",
          mediaUrl: mediaDataUrl,
          text: caption.trim(),
        });
      }
      toast.success("Story posted successfully! 🚀");
      onClose();
    } catch {
      toast.error("Failed to post story");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm theme-panel-bg border theme-border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-bubbleIn">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-5 py-3 border-b theme-border theme-soft-bg/40">
          <div className="flex items-center gap-1 p-1 rounded-xl theme-soft-bg border theme-border">
            <button
              onClick={() => setActiveTab("text")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === "text" ? "theme-accent-bg text-white shadow" : "theme-text-muted hover:theme-text"
              }`}
            >
              <FiType size={13} className="inline mr-1" /> Text Story
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeTab === "media" ? "theme-accent-bg text-white shadow" : "theme-text-muted hover:theme-text"
              }`}
            >
              <FiImage size={13} className="inline mr-1" /> Photo Canvas
            </button>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full theme-text-muted hover:theme-text transition">
            <FiX size={18} />
          </button>
        </div>

        {/* Content Canvas */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
          {activeTab === "text" ? (
            <div className="flex flex-col gap-3 flex-1">
              <div
                className={`flex-1 rounded-2xl bg-gradient-to-tr ${gradientBg} p-6 flex items-center justify-center text-center shadow-inner relative overflow-hidden`}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your story thought..."
                  rows={5}
                  className="w-full bg-transparent text-white text-xl font-bold text-center outline-none placeholder:text-white/50 resize-none drop-shadow"
                  autoFocus
                />
              </div>

              {/* Gradient Palette */}
              <div className="flex justify-center gap-2 py-1">
                {STORY_GRADIENTS.map((grad) => (
                  <button
                    key={grad}
                    onClick={() => setGradientBg(grad)}
                    className={`w-7 h-7 rounded-full bg-gradient-to-tr ${grad} transition-transform ${
                      gradientBg === grad ? "scale-110 ring-2 ring-white" : "opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              <input type="file" ref={fileRef} onChange={handleMediaUpload} accept="image/*" className="hidden" />
              {mediaDataUrl ? (
                <div className="relative flex-1 rounded-2xl overflow-hidden bg-black flex items-center justify-center border theme-border">
                  <img src={mediaDataUrl} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-xs font-semibold border border-white/20"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 rounded-2xl border-2 border-dashed theme-border hover:theme-accent-border cursor-pointer flex flex-col items-center justify-center gap-2 theme-soft-bg/50 transition p-4 text-center"
                >
                  <FiImage size={32} className="theme-text-muted animate-bounce" />
                  <p className="text-xs font-semibold theme-text">Click to upload story photo</p>
                </div>
              )}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full theme-soft-bg border theme-border rounded-xl px-3 py-2 text-xs theme-text outline-none theme-accent-focus"
              />
            </div>
          )}

          <Button onClick={handlePublish} loading={posting} className="w-full py-2.5 text-xs font-bold rounded-xl">
            Publish Story ✨
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryStudio;