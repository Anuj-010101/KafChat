import { useState, useRef, useEffect } from "react";
import { FiUsers, FiCamera, FiX, FiCheck, FiSearch } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { useChat } from "../../hooks/useChat";
import { userService } from "../../services/userService";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup } = useChat();
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const { data } = await userService.searchUsers(searchQuery);
        setSearchResults(data.users || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setGroupAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleUserSelection = (u) => {
    if (selectedUsers.some((item) => item._id === u._id)) {
      setSelectedUsers((prev) => prev.filter((item) => item._id !== u._id));
    } else {
      setSelectedUsers((prev) => [...prev, u]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please provide a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      toast.error("Select at least 2 members for the group");
      return;
    }

    setLoading(true);
    try {
      await createGroup({
        name: groupName.trim(),
        users: selectedUsers.map((u) => u._id),
        groupAvatar: groupAvatar || null,
      });
      setGroupName("");
      setGroupAvatar(null);
      setSelectedUsers([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-bubbleIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md theme-panel-bg border theme-border rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b theme-border theme-soft-bg/40">
          <h3 className="text-sm font-semibold theme-text flex items-center gap-2">
            <FiUsers className="theme-accent-text" /> New Group Chat
          </h3>
          <button onClick={onClose} className="p-1 rounded-full theme-text-muted hover:theme-text transition">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4">
          {/* Avatar + Group Name Input */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 rounded-full theme-soft-bg border-2 border-dashed theme-border hover:theme-accent-border flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group transition"
            >
              {groupAvatar ? (
                <img src={groupAvatar} alt="Group Avatar" className="w-full h-full object-cover" />
              ) : (
                <FiCamera size={20} className="theme-text-muted group-hover:theme-accent-text transition" />
              )}
            </div>

            <input
              type="text"
              placeholder="Group Subject / Name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="flex-1 theme-soft-bg border theme-border rounded-xl px-4 py-2.5 text-xs theme-text placeholder:theme-text-muted outline-none theme-accent-focus transition"
              autoFocus
            />
          </div>

          {/* Selected Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
              {selectedUsers.map((u) => (
                <span
                  key={u._id}
                  className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 theme-accent-tint border theme-accent-border rounded-full text-xs font-medium theme-text"
                >
                  {u.fullName?.split(" ")[0]}
                  <button
                    type="button"
                    onClick={() => toggleUserSelection(u)}
                    className="theme-text-muted hover:theme-text transition"
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Member Search */}
          <div className="flex items-center gap-2 px-3 py-2 theme-soft-bg border theme-border rounded-xl text-xs">
            <FiSearch className="theme-text-muted shrink-0" size={14} />
            <input
              type="text"
              placeholder="Search contacts to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent theme-text outline-none placeholder:theme-text-muted"
            />
          </div>

          {/* Search Result List */}
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-thin">
            {searchResults.map((u) => {
              const isSelected = selectedUsers.some((item) => item._id === u._id);
              return (
                <div
                  key={u._id}
                  onClick={() => toggleUserSelection(u)}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                    isSelected ? "theme-accent-tint border theme-accent-border" : "hover:theme-soft-bg"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={u.avatar} alt={u.fullName} size="sm" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium theme-text">{u.fullName}</span>
                      <span className="text-[10px] theme-text-muted">@{u.username}</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      isSelected
                        ? "theme-accent-bg border-transparent text-white"
                        : "theme-border theme-soft-bg"
                    }`}
                  >
                    {isSelected && <FiCheck size={12} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create Button */}
          <button
            type="submit"
            disabled={loading || !groupName.trim() || selectedUsers.length < 2}
            className="mt-2 w-full py-2.5 theme-accent-bg text-white font-semibold rounded-xl text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow"
          >
            {loading ? "Creating Group..." : `Create Group (${selectedUsers.length} members)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;