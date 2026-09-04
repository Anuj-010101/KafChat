import api from "./api";

export const userService = {
  searchUsers: (search) => api.get(`/users?search=${encodeURIComponent(search || "")}`),
  getUserById: (id) => api.get(`/users/${id}`),
  toggleBlockUser: (id) => api.post(`/users/${id}/block`),
  getSuggestions: () => api.get("/users/suggestions"),
};