import { useState, useRef, useEffect } from "react";
import {
  FiPlus,
  FiSmile,
  FiSend,
  FiImage,
  FiCamera,
  FiFileText,
  FiArchive,
  FiMusic,
  FiMapPin,
  FiUser,
  FiBarChart2,
  FiMic,
  FiSquare,
  FiX,
  FiLayers,
  FiCloud,
  FiZap,
} from "react-icons/fi";
import EmojiPicker, { Theme } from "emoji-picker-react";
import toast from "react-hot-toast";
import BitmojiStickerModal from "./BitmojiStickerModal";
import CameraStudioModal from "../camera/CameraStudioModal";
import api from "../../services/api";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../hooks/useAuth";

const MessageInput = () => {
  const { user } = useAuth();
  const {
    activeChat,
    sendMessage,
    addBatchMessages,
    emitTyping,
    emitStopTyping,
    replyingMessage,
    setReplyingMessage,
  } = useChat();

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showCameraStudio, setShowCameraStudio] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);

  const attachMenuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const multiMediaInputRef = useRef(null);
  const multiDocInputRef = useRef(null);
  const multiVaultInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const isVip = Boolean(user?.isVIP);
  const maxVoiceDuration = isVip ? 300 : 60;

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isGroup = activeChat?.isGroupChat;
  const isCloudVault = activeChat?.isSavedCloud;
  const currentUserId = (user?._id || user?.id)?.toString();
  
  // FIX: Defined otherUser properly here so it won't crash
  const otherUser = activeChat?.participants?.find(
    (p) => (p?._id || p)?.toString() !== currentUserId
  );

  const isCurrentAdmin =
    isGroup &&
    (activeChat.groupAdmins?.some((a) => (a?._id || a)?.toString() === currentUserId) ||
      (activeChat.groupAdmin?._id || activeChat.groupAdmin)?.toString() === currentUserId);

  if (isGroup && activeChat?.onlyAdminsCanMessage && !isCurrentAdmin) {
    return (
      <div className="p-3.5 theme-panel-bg border-t theme-border text-center">
        <p className="text-xs theme-text-muted italic">
          🔒 Only Admins can send messages in this group.
        </p>
      </div>
    );
  }

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim() && !isCloudVault) emitTyping();
    else emitStopTyping();
  };

  const handleMultipleFiles = (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    if (filesArray.length > 30) {
      toast.error("Maximum 30 files can be selected in one batch.");
      return;
    }

    const mappedFiles = filesArray.map((file) => {
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/");
      const isAud = file.type.startsWith("audio/");
      const sizeMB = file.size / (1024 * 1024);

      return {
        rawFile: file,
        name: file.name,
        sizeText: sizeMB > 1024 ? `${(sizeMB / 1024).toFixed(2)} GB` : `${sizeMB.toFixed(1)} MB`,
        previewUrl: isImg ? URL.createObjectURL(file) : null,
        type: isImg ? "image" : isVid ? "video" : isAud ? "audio" : "document",
      };
    });

    setSelectedFiles((prev) => [...prev, ...mappedFiles]);
    setShowAttachMenu(false);
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const voiceFile = new File([audioBlob], `Voice_Note_${Date.now()}.webm`, { type: "audio/webm" });

        setSelectedFiles((prev) => [
          ...prev,
          {
            rawFile: voiceFile,
            name: voiceFile.name,
            sizeText: "Voice Note",
            previewUrl: null,
            type: "audio",
          },
        ]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxVoiceDuration) {
            stopRecording();
            toast.error(`Maximum voice limit reached (${maxVoiceDuration}s)`);
            return maxVoiceDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && selectedFiles.length === 0) return;

    emitStopTyping();

    if (selectedFiles.length > 0) {
      setIsUploadingBatch(true);
      const toastId = toast.loading(`Uploading ${selectedFiles.length} file(s)...`);

      try {
        const formData = new FormData();
        formData.append("chatId", activeChat._id);
        if (text.trim()) formData.append("text", text.trim());

        selectedFiles.forEach((fileObj) => {
          formData.append("files", fileObj.rawFile);
        });

        const { data } = await api.post("/messages/upload-batch", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (data.success && data.messages) {
          addBatchMessages(data.messages);
          toast.dismiss(toastId);
          toast.success(`${selectedFiles.length} file(s) sent! 🎉`);
          setSelectedFiles([]);
          setText("");
        }
      } catch {
        toast.dismiss(toastId);
        toast.error("Batch upload failed. Please try again.");
      } finally {
        setIsUploadingBatch(false);
      }
      return;
    }

    const currentText = text.trim();
    setText("");
    setShowEmoji(false);
    setShowAttachMenu(false);

    if (currentText.startsWith("@ai")) {
      try {
        setAiLoading(true);
        await sendMessage({ text: currentText, mediaType: "none" });

        const { data } = await api.post("/ai/ask", { prompt: currentText });
        if (data.success && data.answer) {
          await sendMessage({
            text: data.answer,
            mediaType: "none",
          });
        }
      } catch (err) {
        console.error("AI query failed:", err);
      } finally {
        setAiLoading(false);
      }
      return;
    }

    try {
      await sendMessage({
        text: currentText,
        mediaType: "none",
      });
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  return (
    <div className="relative theme-panel-bg w-full">
      {/* Reply Quote Preview */}
      {replyingMessage && (
        <div className="mb-2 p-2 rounded-xl theme-soft-bg border-l-4 theme-accent-border flex items-center justify-between gap-2 animate-bubbleIn">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold theme-accent-text block">
              Replying to {replyingMessage.sender?.fullName || "User"}
            </span>
            <p className="text-xs theme-text-muted truncate">
              {replyingMessage.text || (replyingMessage.mediaType === "poll" ? "📊 Poll" : `📎 ${replyingMessage.mediaType}`)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingMessage(null)}
            className="p-1 theme-text-muted hover:theme-text rounded-full shrink-0"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Multi-File Batch Queue Deck */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 p-2.5 rounded-2xl theme-soft-bg border theme-border flex flex-col gap-2 animate-bubbleIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold theme-accent-text flex items-center gap-1.5">
              <FiLayers /> Batch Queue ({selectedFiles.length} files)
            </span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-[11px] text-red-500 hover:underline font-semibold"
            >
              Clear All
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-thin py-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border theme-border shrink-0 flex flex-col items-center justify-center theme-panel-bg shadow-sm group"
              >
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-1 text-center">
                    <span className="text-base">{file.type === "video" ? "🎬" : file.type === "audio" ? "🎙️" : "📄"}</span>
                    <span className="text-[9px] font-bold theme-text truncate max-w-[55px] mt-0.5">{file.name}</span>
                    <span className="text-[8px] theme-text-muted font-mono">{file.sizeText}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeSelectedFile(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center transition"
                >
                  <FiX size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input type="file" ref={multiMediaInputRef} onChange={handleMultipleFiles} accept="image/*,video/*" multiple className="hidden" />
      <input type="file" ref={multiDocInputRef} onChange={handleMultipleFiles} accept=".pdf,.doc,.docx,.txt,.zip,.rar,.7z,.tar,.iso,.apk" multiple className="hidden" />
      <input type="file" ref={multiVaultInputRef} onChange={handleMultipleFiles} multiple className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleMultipleFiles} accept="image/*" capture="environment" className="hidden" />
      <input type="file" ref={audioInputRef} onChange={handleMultipleFiles} accept="audio/*,.mp3,.wav,.ogg,.m4a" multiple className="hidden" />

      {/* Emoji Picker Popup Window */}
      {showEmoji && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-14 left-0 sm:left-2 z-[9999] shadow-2xl rounded-2xl overflow-hidden animate-bubbleIn border theme-border"
        >
          <EmojiPicker
            theme={Theme.AUTO}
            onEmojiClick={(emojiData) => setText((prev) => prev + emojiData.emoji)}
            searchPlaceHolder="Search emoji..."
            width={300}
            height={360}
          />
        </div>
      )}

      {/* Full Multi-Tools Attachment Menu Window */}
      {showAttachMenu && (
        <div
          ref={attachMenuRef}
          className="absolute bottom-14 left-0 sm:left-4 z-[9999] theme-panel-bg border theme-border p-3.5 rounded-3xl shadow-2xl grid grid-cols-4 gap-2.5 w-[290px] sm:w-80 animate-bubbleIn"
        >
          {isCloudVault && (
            <button
              type="button"
              onClick={() => multiVaultInputRef.current?.click()}
              className="col-span-4 p-2.5 rounded-2xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center gap-2 text-xs font-bold theme-accent-text hover:opacity-90 transition"
            >
              <FiCloud size={16} /> Select Multiple Large Files
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setShowCameraStudio(true);
            }}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-rose-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiCamera size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Camera</span>
          </button>

          <button
            type="button"
            onClick={() => multiMediaInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-purple-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiImage size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => multiDocInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition theme-accent-text group"
          >
            <div className="w-11 h-11 rounded-2xl theme-accent-tint flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiFileText size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Docs</span>
          </button>

          <button
            type="button"
            onClick={() => multiDocInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-amber-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiArchive size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">ZIPs</span>
          </button>

          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-orange-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiMusic size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Audio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              sendMessage({
                text: "📍 Location: https://maps.google.com/?q=28.6139,77.2090",
                mediaType: "none",
              });
            }}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-emerald-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiMapPin size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Location</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setShowContactModal(true);
            }}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-blue-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiUser size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Contact</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setShowPollModal(true);
            }}
            className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:theme-soft-bg transition text-yellow-500 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
              <FiBarChart2 size={19} />
            </div>
            <span className="text-[10px] theme-text font-medium">Poll</span>
          </button>
        </div>
      )}

      {/* Main Input Form */}
      {isRecording ? (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-2xl px-3 py-1.5 animate-pulse w-full">
          <div className="flex items-center gap-2 text-red-500 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="text-xs font-mono font-semibold truncate">
              {recordingTime}s / {maxVoiceDuration}s
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={cancelRecording}
              className="text-xs theme-text-muted hover:theme-text transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition shrink-0"
              title="Stop & Attach"
            >
              <FiSquare size={13} />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-1 w-full max-w-full">
          {/* Action Icons */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowEmoji((prev) => !prev);
                setShowAttachMenu(false);
              }}
              className="p-1.5 text-gray-400 hover:theme-accent-text transition shrink-0"
              title="Emoji"
            >
              <FiSmile size={20} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowStickerModal(true);
                setShowEmoji(false);
                setShowAttachMenu(false);
              }}
              className="p-1.5 text-amber-400 hover:text-pink-400 transition shrink-0"
              title="Snap Bitmoji & GIFs"
            >
              <FiZap size={19} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu((prev) => !prev);
                setShowEmoji(false);
              }}
              className={`p-1.5 rounded-full transition shrink-0 ${
                showAttachMenu ? "theme-accent-bg text-white rotate-45" : "text-gray-400 hover:theme-accent-text"
              }`}
              title="Attach Media & Tools"
            >
              <FiPlus size={20} className="transition-transform duration-200" />
            </button>
          </div>

          {/* Text Input */}
          <textarea
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (!isMobile && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }
            }}
            placeholder={
              aiLoading
                ? "⚡ AI thinking..."
                : selectedFiles.length > 0
                ? `Caption for ${selectedFiles.length} file(s)...`
                : isCloudVault
                ? "Save notes, files..."
                : "Type message or '@ai'..."
            }
            className="flex-1 min-w-0 w-full theme-soft-bg border theme-border rounded-xl px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm theme-text placeholder:theme-text-muted outline-none theme-accent-focus transition resize-none max-h-28 overflow-y-auto"
          />

          {/* Send / Mic Button */}
          <div className="shrink-0 pl-0.5">
            {text.trim() || selectedFiles.length > 0 ? (
              <button
                type="submit"
                disabled={isUploadingBatch || aiLoading}
                className="w-9 h-9 rounded-xl theme-accent-bg text-white flex items-center justify-center transition shadow disabled:opacity-50 shrink-0"
              >
                {isUploadingBatch || aiLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend size={15} />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-9 h-9 rounded-xl theme-soft-bg text-gray-400 hover:text-red-500 flex items-center justify-center transition shrink-0"
                title="Record Voice Note"
              >
                <FiMic size={17} />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Bitmoji Modal */}
      <BitmojiStickerModal
        isOpen={showStickerModal}
        onClose={() => setShowStickerModal(false)}
        onSendMedia={sendMessage}
        myUser={user}
        otherUser={otherUser}
      />

      {/* Camera Studio Modal */}
      <CameraStudioModal
        isOpen={showCameraStudio}
        onClose={() => setShowCameraStudio(false)}
        initialMode="story"
      />
    </div>
  );
};

export default MessageInput;