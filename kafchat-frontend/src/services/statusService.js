import api from "./api";

export const statusService = {
  createStatus: (payload) => api.post("/status", payload),

  getFeed: () => api.get("/status"),

  viewStatus: (statusId) => api.post(`/status/${statusId}/view`),

  deleteStatus: (statusId) => api.delete(`/status/${statusId}`),
};