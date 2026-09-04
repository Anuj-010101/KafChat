const Post = require("../models/Post");
const Story = require("../models/Story");
const Notification = require("../models/Notification");
const Activity = require("../models/Activity");
const User = require("../models/User");
const Chat = require("../models/Chat");
const { processFileUpload } = require("../services/storageService");

// @desc Send Follow Request (Public = Auto Follow, Private = Pending Request)
// @route POST /api/social/follow/:userId
exports.sendFollowRequest = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "Cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isAlreadyFollowing = Array.isArray(targetUser.followers) && targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (isAlreadyFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await Activity.deleteMany({ sender: currentUserId, recipient: targetUserId });

      return res.status(200).json({ success: true, status: "UNFOLLOWED", message: "Unfollowed successfully" });
    }

    // If target account is Private -> Send Pending Request
    if (targetUser.isPrivateAccount) {
      const existingReq = await Activity.findOne({
        sender: currentUserId,
        recipient: targetUserId,
        type: "FOLLOW_REQUEST",
        status: "PENDING",
      });

      if (existingReq) {
        // Cancel Request
        await Activity.findByIdAndDelete(existingReq._id);
        return res.status(200).json({ success: true, status: "REQUEST_CANCELLED", message: "Follow request cancelled" });
      }

      await Activity.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: "FOLLOW_REQUEST",
        status: "PENDING",
        isRead: false,
      });

      return res.status(200).json({ success: true, status: "REQUESTED", message: "Follow request sent" });
    }

    // If Public Account -> Direct Mutual Follow & Activity Log
    await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
    await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });

    await Activity.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: "REQUEST_ACCEPTED",
      status: "ACCEPTED",
      isRead: false,
    });

    return res.status(200).json({ success: true, status: "FOLLOWING", message: `Following @${targetUser.username}` });
  } catch (error) {
    console.error("sendFollowRequest error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process follow request" });
  }
};

// @desc Get Activity & Pending Requests
// @route GET /api/social/activity
exports.getActivityFeed = async (req, res) => {
  try {
    const userId = req.user._id;

    const activities = await Activity.find({
      recipient: userId,
      type: { $ne: "FOLLOW_REQUEST" },
    })
      .populate("sender", "fullName username avatar profilePhotos isOnline")
      .sort({ createdAt: -1 })
      .limit(50);

    const pendingRequests = await Activity.find({
      recipient: userId,
      type: "FOLLOW_REQUEST",
      status: "PENDING",
    })
      .populate("sender", "fullName username avatar profilePhotos bio")
      .sort({ createdAt: -1 });

    const unreadCount = await Activity.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      activities: activities || [],
      notifications: activities || [],
      pendingRequests: pendingRequests || [],
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Accept Follow Request
// @route POST /api/social/follow-request/:id/accept
exports.acceptFollowRequest = async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = req.user._id;

    const activity = await Activity.findById(activityId);
    if (!activity) return res.status(404).json({ success: false, message: "Request not found" });

    const requesterId = activity.sender;

    // 1. Update requester as follower of currentUser
    await User.findByIdAndUpdate(userId, { $addToSet: { followers: requesterId } });
    await User.findByIdAndUpdate(requesterId, { $addToSet: { following: userId } });

    // 2. Remove pending request activity
    await Activity.findByIdAndDelete(activityId);

    // 3. Notify requester that their request was accepted
    await Activity.create({
      recipient: requesterId,
      sender: userId,
      type: "REQUEST_ACCEPTED",
      status: "ACCEPTED",
      isRead: false,
    });

    return res.status(200).json({ success: true, message: "Follow request accepted" });
  } catch (error) {
    console.error("acceptFollowRequest error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Reject Follow Request
// @route POST /api/social/follow-request/:id/reject
exports.rejectFollowRequest = async (req, res) => {
  try {
    const activityId = req.params.id;
    await Activity.findByIdAndDelete(activityId);
    return res.status(200).json({ success: true, message: "Follow request removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Mark Activities Read
exports.markActivityAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Activity.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
    return res.status(200).json({ success: true, message: "Activities marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create Story
exports.createStory = async (req, res) => {
  try {
    const userId = req.user._id;
    const isVIP = req.user.isVIP;
    let mediaUrl = req.body.mediaUrl;
    let mediaType = req.body.mediaType || "image";

    if (req.file) {
      const uploaded = await processFileUpload(req.file, req);
      mediaUrl = uploaded.fileUrl;
      mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    }

    if (!mediaUrl) return res.status(400).json({ success: false, message: "Media is required" });

    const {
      filter = "normal",
      duration = 15,
      overlays = "[]",
      mentions = "[]",
      hiddenFrom = "[]",
      isCloseFriends = "false",
      audioTitle = "",
      audioUrl = "",
    } = req.body;

    const maxAllowedDuration = isVIP ? 120 : 45;
    const safeDuration = Math.min(Number(duration) || 15, maxAllowedDuration);

    const newStory = await Story.create({
      user: userId,
      mediaUrl,
      mediaType,
      filter,
      duration: safeDuration,
      overlays: typeof overlays === "string" ? JSON.parse(overlays) : overlays,
      mentions: typeof mentions === "string" ? JSON.parse(mentions) : mentions,
      hiddenFrom: typeof hiddenFrom === "string" ? JSON.parse(hiddenFrom) : hiddenFrom,
      isCloseFriends: isCloseFriends === "true" || isCloseFriends === true,
      audioTrack: { title: audioTitle, audioUrl: audioUrl },
    });

    const populatedStory = await Story.findById(newStory._id).populate("user", "fullName username avatar profilePhotos");
    return res.status(201).json({ success: true, story: populatedStory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get Active Stories
exports.getStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      createdAt: { $gte: twentyFourHoursAgo },
      hiddenFrom: { $ne: userId },
    })
      .populate("user", "fullName username avatar profilePhotos avatarBitmojiFallback closeFriends blockedUsers")
      .populate("mentions", "fullName username avatar profilePhotos")
      .sort({ createdAt: -1 });

    const filteredStories = stories.filter((story) => {
      if (story.isCloseFriends) {
        const isAuthor = story.user._id.toString() === userId.toString();
        const isFriend = story.user.closeFriends?.some((id) => id.toString() === userId.toString());
        return isAuthor || isFriend;
      }
      return true;
    });

    const groupedStories = {};
    filteredStories.forEach((story) => {
      const uId = story.user._id.toString();
      if (!groupedStories[uId]) {
        groupedStories[uId] = { user: story.user, stories: [] };
      }
      groupedStories[uId].stories.push(story);
    });

    return res.status(200).json({ success: true, storiesGrouped: Object.values(groupedStories) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Story Archive
exports.getStoryArchive = async (req, res) => {
  try {
    const userId = req.user._id;
    const archivedStories = await Story.find({ user: userId }).populate("mentions", "fullName username avatar").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, archive: archivedStories || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Create Post
exports.createPost = async (req, res) => {
  try {
    const userId = req.user._id;
    let mediaUrl = req.body.mediaUrl;

    if (req.file) {
      const uploaded = await processFileUpload(req.file, req);
      mediaUrl = uploaded.fileUrl;
    }

    if (!mediaUrl) return res.status(400).json({ success: false, message: "Media is required" });

    const { type = "post", caption = "", filter = "normal", duration = 0, mentions = "[]", audioTitle = "", audioArtist = "", audioUrl = "" } = req.body;

    const newPost = await Post.create({
      author: userId,
      type: type === "reel" ? "reel" : "post",
      mediaUrl,
      caption,
      filter,
      duration: Math.min(Number(duration) || 0, 600),
      mentions: typeof mentions === "string" ? JSON.parse(mentions) : mentions,
      audioTrack: { title: audioTitle, artist: audioArtist, audioUrl: audioUrl },
    });

    const populatedPost = await Post.findById(newPost._id).populate("author", "fullName username avatar profilePhotos").populate("mentions", "fullName username avatar");
    return res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Like Post
exports.toggleLikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const isLiked = post.likes.some((id) => id.toString() === userId.toString());
    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
      if (post.author.toString() !== userId.toString()) {
        await Activity.create({
          recipient: post.author,
          sender: userId,
          type: post.type === "reel" ? "LIKE_REEL" : "LIKE_POST",
          metadata: { postId: post._id },
        });
      }
    }

    await post.save();
    return res.status(200).json({ success: true, likesCount: post.likes.length, isLiked: !isLiked });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Reels Feed
exports.getReelsFeed = async (req, res) => {
  try {
    const reels = await Post.find({ type: "reel" }).populate("author", "fullName username avatar profilePhotos isVIP").sort({ createdAt: -1 }).limit(50);
    return res.status(200).json({ success: true, reels: reels || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc User Posts
exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      posts: posts.filter((p) => p.type !== "reel"),
      reels: posts.filter((p) => p.type === "reel"),
      totalCount: posts.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};