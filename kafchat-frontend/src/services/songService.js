import api from "./api";

export const songService = {
  getSongs: (search = "") => api.get(`/songs?search=${encodeURIComponent(search)}`),
};