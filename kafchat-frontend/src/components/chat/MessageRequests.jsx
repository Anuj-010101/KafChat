import { FiCheck, FiTrash2, FiUser, FiArrowLeft } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { useChat } from "../../hooks/useChat";
import { formatLastSeen } from "../../utils/formatTime";

const MessageRequests = ({ requests, onSelectChat, onBack }) => {
  const { acceptRequest, rejectRequest, activeChat } = useChat();

  if (!requests || requests.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-ink-soft border border-ink-border flex items-center justify-center text-ash-muted mb-3">
          <FiUser size={20} />
        </div>
        <p className="text-sm font-semibold text-ash">No Message Requests</p>
        <p className="text-xs text-ash-muted mt-1 max-w-[200px]">
          You don't have any pending requests from new users.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-1.5 rounded-xl bg-ink-soft hover:bg-ink-border text-xs text-ash transition"
          >
            Back to Chats
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Requests Header Bar */}
      <div className="px-4 py-2 bg-ink-soft/40 border-b border-ink-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1 rounded-lg text-ash-muted hover:text-ash">
              <FiArrowLeft size={16} />
            </button>
          )}
          <span className="text-xs font-semibold text-ash">
            Pending Requests ({requests.length})
          </span>
        </div>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink-border/40">
        {requests.map((chat) => {
          const sender = chat.requestedBy || chat.participants?.find((p) => !p._id?.includes(chat.requestedBy));
          const isSelected = activeChat?._id === chat._id;

          return (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`p-3.5 flex flex-col gap-2.5 cursor-pointer transition ${
                isSelected ? "bg-ink-soft" : "hover:bg-ink-soft/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={sender?.avatar} alt={sender?.fullName || "User"} size="md" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-ash truncate">
                      {sender?.fullName || "New User"}
                    </span>
                    <span className="text-[11px] text-ash-muted truncate">
                      @{sender?.username || "user"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-ash-faint font-mono">
                  {formatLastSeen(chat.updatedAt)}
                </span>
              </div>

              {/* Message Snippet */}
              <p className="text-xs text-ash-muted truncate pl-12">
                {chat.lastMessage?.text || "Sent you a message invitation"}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    rejectRequest(chat._id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold flex items-center gap-1 transition"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    acceptRequest(chat._id);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-signal-sky hover:bg-sky-400 text-ink text-[11px] font-bold flex items-center gap-1 transition shadow"
                >
                  <FiCheck size={13} /> Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageRequests;