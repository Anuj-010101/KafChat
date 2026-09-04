import api from "./api";

export const callService = {
  getCallHistory: (chatId, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (chatId) params.append("chatId", chatId);
    return api.get(`/calls?${params.toString()}`);
  },
};
