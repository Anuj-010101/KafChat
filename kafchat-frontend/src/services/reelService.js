import api from "./api";

export const reelService = {
  getFeed: (page = 1, limit = 15) => api.get(`/reels/feed?page=${page}&limit=${limit}`),

  createReel: (formData) =>
    api.post("/reels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  toggleLike: (reelId) => api.post(`/reels/${reelId}/like`),

  getLikers: (reelId, search = "") => api.get(`/reels/${reelId}/likers?search=${encodeURIComponent(search)}`),

  downloadReel: (reelId) => api.get(`/reels/${reelId}/download`),

  addComment: (reelId, text) => api.post(`/reels/${reelId}/comment`, { text }),
};