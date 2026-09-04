import { useState, useEffect } from "react";
import { FiPlus, FiStar, FiCamera, FiImage, FiX } from "react-icons/fi";
import Avatar from "../common/Avatar";
import StatusViewer from "./StatusViewer";
import CreateStatusModal from "./CreateStatusModal";
import CameraStudioModal from "../camera/CameraStudioModal";
import { useAuth } from "../../hooks/useAuth";
import { useStatus } from "../../hooks/useStatus";

const StatusBar = () => {
  const { user } = useAuth();
  const { statusGroups = [], fetchStatuses } = useStatus() || {};
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCameraStudio, setShowCameraStudio] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLauncherSheet, setShowLauncherSheet] = useState(false);

  useEffect(() => {
    if (fetchStatuses) fetchStatuses();
  }, [fetchStatuses]);

  const currentUserId = (user?._id || user?.id)?.toString();

  const myStatusGroup = statusGroups.find(
    (g) => (g.user?._id || g.user)?.toString() === currentUserId
  );
  const contactGroups = statusGroups.filter(
    (g) => (g.user?._id || g.user)?.toString() !== currentUserId
  );

  const hasUnseenMyStory = myStatusGroup?.statuses?.some(
    (s) => !s.viewers?.some((v) => (v?.user?._id || v?.user || v)?.toString() === currentUserId)
  );

  return (
    <>
      <div className="p-3 border-b theme-border theme-panel-bg flex items-center gap-3 overflow-x-auto scrollbar-none select-none relative">
        {/* My Story Bubble */}
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group relative">
          <div className="relative">
            <div
              onClick={() => {
                if (myStatusGroup && myStatusGroup.statuses?.length > 0) {
                  setSelectedGroup(myStatusGroup);
                } else {
                  setShowLauncherSheet(true);
                }
              }}
              className={`rounded-full transition-transform group-hover:scale-105 ${
                myStatusGroup && myStatusGroup.statuses?.length > 0
                  ? hasUnseenMyStory
                    ? "p-[2.5px] bg-gradient-to-tr from-pink-500 via-purple-400 to-cyan-400"
                    : "p-[2px] border-2 border-slate-400/50 dark:border-slate-600"
                  : "p-[2px] border-2 border-dashed theme-border"
              }`}
            >
              <div className="rounded-full p-[2px] theme-panel-bg flex items-center justify-center">
                <Avatar
                  src={user?.avatar}
                  alt={user?.fullName || "My Story"}
                  size="md"
                  className="rounded-full object-cover"
                />
              </div>
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLauncherSheet(true);
              }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-black shadow-md hover:scale-110 active:scale-95 transition"
              title="Add Story"
            >
              <FiPlus size={12} className="stroke-[3]" />
            </button>
          </div>
          <span className="text-[10px] font-semibold theme-text truncate max-w-[58px]">
            Your Story
          </span>
        </div>

        {/* Separator */}
        {contactGroups.length > 0 && (
          <div className="h-8 w-[1px] theme-border shrink-0" />
        )}

        {/* Contacts' Story Tray */}
        {contactGroups.map((grp) => {
          const author = grp.user;
          const hasUnseen = grp.statuses?.some(
            (s) =>
              !s.viewers?.some(
                (v) => (v?.user?._id || v?.user || v)?.toString() === currentUserId
              )
          );
          const hasCloseFriends = grp.statuses?.some(
            (s) => s.isCloseFriends || s.privacy === "close_friends"
          );

          // Instagram Ring Rules:
          // 1. Agar story dekh li gayi hai (!hasUnseen): Ring hamesha Grey hogi, chahe Close Friends ho ya Normal.
          // 2. Agar unseen hai: Close Friends ke liye Green, aur Normal ke liye Gradient.
          let ringWrapperClass = "p-[2px] border-2 border-slate-400/50 dark:border-slate-600 opacity-60";
          if (hasUnseen) {
            if (hasCloseFriends) {
              ringWrapperClass = "p-[2.5px] bg-emerald-500 shadow-sm shadow-emerald-500/20";
            } else {
              ringWrapperClass = "p-[2.5px] bg-gradient-to-tr from-pink-500 via-purple-400 to-cyan-400";
            }
          }

          return (
            <div
              key={grp._id || author?._id}
              onClick={() => setSelectedGroup(grp)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className={`rounded-full transition-transform group-hover:scale-105 ${ringWrapperClass}`}>
                <div className="rounded-full p-[2px] theme-panel-bg flex items-center justify-center relative">
                  <Avatar
                    src={author?.avatar}
                    alt={author?.fullName}
                    size="md"
                    className="rounded-full object-cover"
                  />
                  {hasCloseFriends && hasUnseen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[8px] font-bold shadow">
                      <FiStar size={9} className="fill-black" />
                    </div>
                  )}
                  {author?.isVIP && (
                    <div className="absolute -bottom-1 -left-1 px-1 rounded-full bg-amber-500 text-black text-[7px] font-black shadow">
                      PRO
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium theme-text truncate max-w-[58px]">
                {author?.fullName?.split(" ")[0] || "Friend"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet Launcher */}
      {showLauncherSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn select-none"
          onClick={() => setShowLauncherSheet(false)}
        >
          <div
            className="w-full sm:max-w-xs theme-panel-bg border-t sm:border theme-border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 flex flex-col gap-3 animate-bubbleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b theme-border">
              <span className="text-xs font-black uppercase tracking-wider theme-text">
                Create Story
              </span>
              <button
                type="button"
                onClick={() => setShowLauncherSheet(false)}
                className="theme-text-muted hover:theme-text p-1"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLauncherSheet(false);
                  setShowCameraStudio(true);
                }}
                className="p-3.5 rounded-2xl theme-soft-bg border theme-border flex flex-col items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500/15 text-pink-500 flex items-center justify-center">
                  <FiCamera size={18} />
                </div>
                <span className="text-xs font-bold theme-text">Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLauncherSheet(false);
                  setShowCreateModal(true);
                }}
                className="p-3.5 rounded-2xl theme-soft-bg border theme-border flex flex-col items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                  <FiImage size={18} />
                </div>
                <span className="text-xs font-bold theme-text">Gallery & Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer */}
      {selectedGroup && (
        <StatusViewer
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {/* Create Status Modal */}
      {showCreateModal && (
        <CreateStatusModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Camera Studio Modal */}
      <CameraStudioModal
        isOpen={showCameraStudio}
        onClose={() => setShowCameraStudio(false)}
        initialMode="story"
      />
    </>
  );
};

export default StatusBar;