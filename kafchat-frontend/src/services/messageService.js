import api from "./api";

export const messageService = {
  getMessages: (chatId) => api.get(`/messages/${chatId}`),
  sendMessage: (data) => api.post("/messages", data),
  markRead: (chatId) => api.patch(`/messages/read/${chatId}`),
  markAsRead: (chatId) => api.patch(`/messages/read/${chatId}`),
  votePoll: (messageId, optionIndex) => api.patch(`/messages/${messageId}/vote`, { optionIndex }),
  togglePin: (messageId) => api.patch(`/messages/${messageId}/pin`),
  editMessage: (messageId, text) => api.patch(`/messages/${messageId}`, { text }),
  deleteMessage: (messageId, forEveryone) => api.delete(`/messages/${messageId}?forEveryone=${forEveryone}`),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
};