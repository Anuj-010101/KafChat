import api from "./api";

export const chatService = {
  // Direct & Group Chats
  accessChat: (userId) => api.post("/chats/access", { userId }),
  accessPersonalVault: () => api.post("/chats/personal-vault"),
  fetchChats: () => api.get("/chats"),
  createGroup: (payload) => api.post("/chats/group", payload),

  // Requests
  acceptRequest: (chatId) => api.patch(`/chats/${chatId}/accept`),
  rejectRequest: (chatId) => api.patch(`/chats/${chatId}/reject`),

  // Clear & Delete
  clearChat: (chatId) => api.delete(`/chats/${chatId}/clear`),
  deleteConversation: (chatId) => api.delete(`/chats/${chatId}`),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`),

  // Group Management
  updateGroupInfo: (chatId, payload) => api.patch(`/chats/group/update/${chatId}`, payload),
  addMember: (chatId, userId) => api.patch("/chats/group/add", { chatId, userId }),
  removeMember: (chatId, userId) => api.patch("/chats/group/remove", { chatId, userId }),
  toggleAdmin: (chatId, userId) => api.patch("/chats/group/admin", { chatId, userId }),

  // Chat Controls & Lock
  setDisappearingTimer: (chatId, timer) => api.patch(`/chats/${chatId}/disappearing`, { timer }),
  togglePinChat: (chatId) => api.patch(`/chats/${chatId}/pin`),
  toggleMute: (chatId, duration) => api.patch(`/chats/${chatId}/mute`, { duration }),
  toggleArchive: (chatId) => api.patch(`/chats/${chatId}/archive`),
  toggleLock: (chatId, pin) => api.post(`/chats/${chatId}/toggle-lock`, { pin }),
};