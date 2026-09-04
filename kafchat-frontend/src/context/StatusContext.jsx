import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";
import { statusService } from "../services/statusService";

export const StatusContext = createContext(null);

export const StatusProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await statusService.getFeed();
      const statusesList = data.feed || data.statusGroups || data.statuses || [];
      setFeed(statusesList);
    } catch (err) {
      console.error("Failed to fetch status feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshFeed();
  }, [isAuthenticated, refreshFeed]);

  const postStatus = useCallback(
    async (payload) => {
      try {
        await statusService.createStatus(payload);
        toast.success("Status posted successfully! 🚀");
        await refreshFeed();
      } catch (err) {
        console.error("Post status error:", err);
        toast.error(err.response?.data?.message || "Couldn't post status");
      }
    },
    [refreshFeed]
  );

  const markViewed = useCallback(
    async (statusId) => {
      try {
        await statusService.viewStatus(statusId);
        await refreshFeed();
      } catch {
        /* non-critical */
      }
    },
    [refreshFeed]
  );

  const removeStatus = useCallback(
    async (statusId) => {
      try {
        await statusService.deleteStatus(statusId);
        toast.success("Status removed");
        await refreshFeed();
      } catch (err) {
        toast.error("Couldn't delete status");
      }
    },
    [refreshFeed]
  );

  const value = { 
    feed, 
    statusGroups: feed, 
    loading, 
    refreshFeed, 
    postStatus, 
    markViewed, 
    removeStatus 
  };

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
};