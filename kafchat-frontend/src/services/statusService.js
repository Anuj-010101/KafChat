import api from "./api";

export const statusService = {
  getFeed: async () => {
    return await api.get("/status/feed");
  },

  createStatus: async (payload) => {
    const isFormData = payload instanceof FormData;
    return await api.post("/status", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    });
  },

  viewStatus: async (statusId) => {
    return await api.post(`/status/${statusId}/view`);
  },

  deleteStatus: async (statusId) => {
    return await api.delete(`/status/${statusId}`);
  },
};