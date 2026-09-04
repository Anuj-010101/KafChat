import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { reelService } from "../services/reelService";

export const useReels = () => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFeed = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await reelService.getFeed(page);
      if (data.success) {
        setReels(data.reels);
      }
    } catch (err) {
      console.error("Failed to fetch reels feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const postReel = async (formData) => {
    try {
      const { data } = await reelService.createReel(formData);
      if (data.success) {
        toast.success("Reel published successfully! 🎬");
        setReels((prev) => [data.reel, ...prev]);
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish reel");
      return false;
    }
  };

  const toggleLike = async (reelId) => {
    try {
      const { data } = await reelService.toggleLike(reelId);
      if (data.success) {
        setReels((prev) =>
          prev.map((r) =>
            r._id === reelId
              ? {
                  ...r,
                  likes: data.isLiked
                    ? [...r.likes, data.userId]
                    : r.likes.filter((id) => id.toString() !== data.userId?.toString()),
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  };

  return { reels, loading, fetchFeed, postReel, toggleLike };
};