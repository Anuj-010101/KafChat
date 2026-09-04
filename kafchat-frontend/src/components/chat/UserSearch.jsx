import { useState, useEffect } from "react";
import { FiSearch, FiX, FiUserPlus, FiCheck } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { userService } from "../../services/userService";
import { useChat } from "../../hooks/useChat";

const UserSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const { startChatWithUser } = useChat();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await userService.searchUsers(query.trim());
        setResults(data.users || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    try {
      await startChatWithUser(selectedUser._id);
      setRequestSent(true);
      setTimeout(() => {
        setSelectedUser(null);
        setRequestSent(false);
        setQuery("");
        setResults([]);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-3 relative">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl theme-soft-bg border border-gray-700/40 focus-within:ring-1 focus-within:ring-sky-400 transition">
        <FiSearch className="theme-text-muted shrink-0" size={14} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users to chat..."
          className="bg-transparent text-xs theme-text placeholder:opacity-60 outline-none w-full"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedUser(null);
            }}
            className="theme-text-muted hover:opacity-100 p-0.5"
          >
            <FiX size={13} />
          </button>
        )}
      </div>

      {/* Floating Results List */}
      {query.trim() && !selectedUser && (
        <div className="absolute left-3 right-3 top-13 z-40 theme-panel-bg border border-gray-700/60 rounded-2xl shadow-2xl max-h-60 overflow-y-auto scrollbar-thin p-1">
          {searching ? (
            <p className="text-xs theme-text-muted p-3 text-center">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-xs theme-text-muted p-3 text-center">No users found</p>
          ) : (
            results.map((u) => (
              <div
                key={u._id}
                onClick={() => setSelectedUser(u)}
                className="p-2 rounded-xl hover:opacity-80 theme-soft-bg/50 cursor-pointer flex items-center justify-between transition my-0.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatar} alt={u.fullName} online={u.isOnline} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold theme-text truncate">{u.fullName}</span>
                    <span className="text-[10px] theme-text-muted truncate">@{u.username}</span>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-sky-400 border border-sky-400/30 px-2 py-0.5 rounded-full">
                  View
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Profile Preview Card (Requires user to click button to send request) */}
      {selectedUser && (
        <div className="absolute left-3 right-3 top-13 z-50 theme-panel-bg border border-gray-700/80 rounded-2xl shadow-2xl p-4 flex flex-col items-center text-center animate-bubbleIn">
          <button
            onClick={() => setSelectedUser(null)}
            className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-white"
          >
            <FiX size={15} />
          </button>

          <Avatar src={selectedUser.avatar} alt={selectedUser.fullName} size="lg" online={selectedUser.isOnline} />
          
          <h4 className="text-sm font-bold theme-text mt-2">{selectedUser.fullName}</h4>
          <p className="text-xs theme-text-muted">@{selectedUser.username}</p>
          {selectedUser.bio && (
            <p className="text-[11px] text-gray-400 italic mt-1 max-w-xs">{selectedUser.bio}</p>
          )}

          <button
            onClick={handleSendRequest}
            disabled={requestSent}
            className={`mt-4 w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition ${
              requestSent
                ? "bg-emerald-600 text-white"
                : "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20"
            }`}
          >
            {requestSent ? (
              <>
                <FiCheck size={14} /> Request Sent!
              </>
            ) : (
              <>
                <FiUserPlus size={14} /> Send Chat Request
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserSearch;