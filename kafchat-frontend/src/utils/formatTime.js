import { format, isToday, isYesterday } from "date-fns";

// Message bubble timestamp, e.g. "9:41 PM"
export const formatMessageTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return format(d, "h:mm a");
};

// Generic formatTime alias
export const formatTime = (date) => formatMessageTime(date);

// Sidebar chat list timestamp — smart relative label (e.g. 9:41 PM, Yesterday, 21/08/26)
export const formatChatTimestamp = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "dd/MM/yy");
};

// formatTimeAgo alias for ChatList compatibility
export const formatTimeAgo = (date) => formatChatTimestamp(date);

// "last seen" label for user status
export const formatLastSeen = (date) => {
  if (!date) return "offline";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "offline";
  if (isToday(d)) return `last seen today at ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `last seen yesterday at ${format(d, "h:mm a")}`;
  return `last seen ${format(d, "dd MMM yyyy")}`;
};