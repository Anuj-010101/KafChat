const User = require("../models/User");
const Chat = require("../models/Chat");
const Post = require("../models/Post");

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// @desc Get user profile by exact username (Case-insensitive)
// @route GET /api/users/username/:username
exports.getUserByUsername = async (req, res) => {
  try {
    const rawUsername = (req.params.username || "").replace(/^@+/, "").trim();
    if (!rawUsername) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${escapeRegex(rawUsername)}$`, "i") },
    }).select("fullName username avatar profilePhotos isVIP bio isPrivateAccount followers following");

    if (!user) {
      return res.status(404).json({ success: false, message: `@${rawUsername} not found` });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("getUserByUsername error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching user" });
  }
};

// @desc Universal Search (By Name or @username)
// @route GET /api/users/search OR /api/users
exports.searchUsers = async (req, res) => {
  try {
    const rawQuery = (req.query.search || req.query.q || "").trim();
    const myId = req.user._id;

    if (!rawQuery) {
      return res.status(200).json({ success: true, users: [] });
    }

    const cleanKeyword = rawQuery.replace(/^@+/, "").trim();
    const safePattern = escapeRegex(cleanKeyword);
    const regex = new RegExp(safePattern, "i");

    const users = await User.find({
      _id: { $ne: myId },
      $or: [
        { username: regex },
        { fullName: regex },
      ],
    })
      .select("fullName username avatar profilePhotos isVIP isOnline bio isPrivateAccount isGhostModeActive followers following")
      .limit(30);

    const sanitizedUsers = users.map((u) => {
      const userObj = u.toObject();
      if (userObj.isGhostModeActive) {
        userObj.isOnline = false;
        userObj.lastSeen = null;
      }
      return userObj;
    });

    return res.status(200).json({
      success: true,
      count: sanitizedUsers.length,
      users: sanitizedUsers,
    });
  } catch (error) {
    console.error("searchUsers error:", error);
    return res.status(500).json({ success: false, message: "Search error", users: [] });
  }
};

// @desc Get Followers & Following Network List for a User
// @route GET /api/users/:id/network
exports.getUserNetwork = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = await User.findById(targetUserId)
      .populate("followers", "fullName username avatar profilePhotos isVIP isPrivateAccount")
      .populate("following", "fullName username avatar profilePhotos isVIP isPrivateAccount");

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      followers: targetUser.followers || [],
      following: targetUser.following || [],
    });
  } catch (error) {
    console.error("getUserNetwork error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch network" });
  }
};

// @desc Get User Profile with Posts (Instagram Style Privacy)
// @route GET /api/users/:id/profile
exports.getUserProfileWithPosts = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = await User.findById(targetUserId)
      .select("-password -lockPin -otp -otpExpires")
      .populate("followers", "_id")
      .populate("following", "_id");

    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let posts = [];
    try {
      posts = await Post.find({ sender: targetUserId }).sort({ createdAt: -1 });
    } catch {
      posts = [];
    }

    return res.status(200).json({
      success: true,
      user: targetUser,
      posts: targetUser.isPrivateAccount ? [] : posts,
    });
  } catch (error) {
    console.error("getUserProfileWithPosts error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// @desc Get Close Friends, Hidden Story Users & Contact List
// @route GET /api/users/close-friends
exports.getCloseFriendsAndContacts = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const me = await User.findById(currentUserId)
      .populate("closeFriends", "fullName username avatar profilePhotos isVIP")
      .populate("followers", "fullName username avatar profilePhotos isVIP")
      .populate("following", "fullName username avatar profilePhotos isVIP");

    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    const chats = await Chat.find({
      participants: currentUserId,
      isGroupChat: false,
    }).populate("participants", "fullName username avatar profilePhotos isVIP");

    const contactMap = new Map();

    (me.followers || []).forEach((u) => u && contactMap.set(u._id.toString(), u));
    (me.following || []).forEach((u) => u && contactMap.set(u._id.toString(), u));

    chats.forEach((c) => {
      (c.participants || []).forEach((p) => {
        if (p && p._id.toString() !== currentUserId.toString()) {
          contactMap.set(p._id.toString(), p);
        }
      });
    });

    return res.status(200).json({
      success: true,
      closeFriends: (me.closeFriends || []).map((u) => u._id.toString()),
      hiddenFrom: (me.blockedUsers || []).map((u) => u.toString()),
      contacts: Array.from(contactMap.values()),
    });
  } catch (error) {
    console.error("getCloseFriendsAndContacts error:", error);
    return res.status(500).json({ success: false, message: "Failed to load contacts" });
  }
};

// @desc Toggle Close Friend
// @route POST /api/users/close-friends/:contactId/toggle
exports.toggleCloseFriend = async (req, res) => {
  try {
    const { contactId } = req.params;
    const currentUserId = req.user._id;

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    if (!me.closeFriends) me.closeFriends = [];

    const isCF = me.closeFriends.some((id) => id.toString() === contactId.toString());

    if (isCF) {
      me.closeFriends = me.closeFriends.filter((id) => id.toString() !== contactId.toString());
    } else {
      me.closeFriends.push(contactId);
    }

    await me.save();

    return res.status(200).json({
      success: true,
      isCloseFriend: !isCF,
      message: !isCF ? "Added to Close Friends" : "Removed from Close Friends",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Toggle Story Hide for User
// @route POST /api/users/story-hide/:contactId/toggle
exports.toggleStoryHide = async (req, res) => {
  try {
    const { contactId } = req.params;
    const currentUserId = req.user._id;

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    if (!me.blockedUsers) me.blockedUsers = [];

    const isHidden = me.blockedUsers.some((id) => id.toString() === contactId.toString());

    if (isHidden) {
      me.blockedUsers = me.blockedUsers.filter((id) => id.toString() !== contactId.toString());
    } else {
      me.blockedUsers.push(contactId);
    }

    await me.save();

    return res.status(200).json({
      success: true,
      isStoryHidden: !isHidden,
      message: !isHidden ? "Story hidden for user" : "Story unhidden for user",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Unfollow User
// @route PATCH /api/users/unfollow/:id
exports.unfollowUser = async (req, res) => {
  try {
    const userIdToUnfollow = req.params.id;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userIdToUnfollow) {
      return res.status(400).json({ success: false, message: "Aap khud ko unfollow nahi kar sakte" });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: userIdToUnfollow },
    });

    await User.findByIdAndUpdate(userIdToUnfollow, {
      $pull: { followers: currentUserId },
    });

    return res.status(200).json({ success: true, message: "Successfully unfollowed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get full user profile
// @route GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -lockPin -otp -otpExpires")
      .populate("followers", "fullName username avatar profilePhotos")
      .populate("following", "fullName username avatar profilePhotos");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userObj = user.toObject();
    if (!userObj.profilePhotos || userObj.profilePhotos.length === 0) {
      userObj.avatarFallback = userObj.avatarBitmojiFallback;
    }

    if (userObj.isGhostModeActive && req.user._id.toString() !== userObj._id.toString()) {
      userObj.isOnline = false;
      userObj.lastSeen = null;
    }

    return res.status(200).json({ success: true, user: userObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error fetching user" });
  }
};

// @desc Update user profile
// @route PATCH /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const {
      fullName,
      bio,
      avatar,
      profilePhotos,
      gender,
      dob,
      location,
      website,
      showDob,
      isPrivateAccount,
      isGhostModeActive,
      hdUploadEnabled,
      autoDeleteMonths,
    } = req.body;

    if (fullName) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    if (Array.isArray(profilePhotos)) {
      const maxAllowed = user.isVIP ? 5 : 1;
      user.profilePhotos = profilePhotos.slice(0, maxAllowed).map((p) => {
        if (typeof p === "string") return { url: p, uploadedAt: new Date() };
        return p;
      });
    }

    if (gender !== undefined) user.gender = gender;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : null;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (showDob !== undefined) user.showDob = Boolean(showDob);
    if (isPrivateAccount !== undefined) user.isPrivateAccount = Boolean(isPrivateAccount);
    if (isGhostModeActive !== undefined) user.isGhostModeActive = Boolean(isGhostModeActive);

    if (hdUploadEnabled !== undefined) {
      user.hdUploadEnabled = user.isVIP ? Boolean(hdUploadEnabled) : false;
    }

    if (autoDeleteMonths !== undefined) user.autoDeleteMonths = Number(autoDeleteMonths) || 0;

    await user.save();

    const updated = await User.findById(user._id).select("-password -lockPin -otp -otpExpires");
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// @desc Block or Unblock a user
// @route POST /api/users/:id/block
exports.toggleBlockUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const myUser = await User.findById(req.user._id);

    if (!myUser.blockedUsers) myUser.blockedUsers = [];

    const isBlocked = myUser.blockedUsers.some((id) => id.toString() === targetUserId.toString());
    if (isBlocked) {
      myUser.blockedUsers = myUser.blockedUsers.filter((id) => id.toString() !== targetUserId.toString());
    } else {
      myUser.blockedUsers.push(targetUserId);
    }

    await myUser.save();
    return res.status(200).json({
      success: true,
      message: isBlocked ? "User unblocked successfully" : "User blocked successfully",
      isBlocked: !isBlocked,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error blocking user" });
  }
};

// @desc Get List of Blocked Users
// @route GET /api/users/blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "blockedUsers",
      "fullName username avatar profilePhotos"
    );
    return res.status(200).json({
      success: true,
      blocked: user?.blockedUsers || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch blocked users" });
  }
};

// @desc Get Suggested Users for Discovery Tray
// @route GET /api/users/suggestions
exports.getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const existingChats = await Chat.find({
      participants: { $elemMatch: { $eq: currentUserId } },
    }).select("participants");

    const connectedUserIds = new Set();
    connectedUserIds.add(currentUserId.toString());

    (existingChats || []).forEach((chat) => {
      (chat?.participants || []).forEach((pId) => {
        if (pId) connectedUserIds.add(pId.toString());
      });
    });

    const suggestions = await User.find({
      _id: { $nin: Array.from(connectedUserIds) },
    })
      .select("fullName username avatar profilePhotos avatarBitmojiFallback isVIP isOnline bio isPrivateAccount isGhostModeActive")
      .limit(15);

    const sanitizedSuggestions = suggestions.map((u) => {
      const userObj = u.toObject();
      if (userObj.isGhostModeActive) {
        userObj.isOnline = false;
        userObj.lastSeen = null;
      }
      return userObj;
    });

    return res.status(200).json({
      success: true,
      suggestions: sanitizedSuggestions || [],
    });
  } catch (error) {
    console.error("getSuggestedUsers error:", error);
    return res.status(200).json({ success: true, suggestions: [] });
  }
};

// @desc Permanently Delete Account
// @route DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    await Chat.deleteMany({ participants: userId, isGroupChat: false });
    return res.status(200).json({ success: true, message: "Account deleted permanently" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};

// @desc Follow User
// @route POST /api/users/follow/:id
exports.followUser = async (req, res) => {
  try {
    const userIdToFollow = req.params.id;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userIdToFollow) {
      return res.status(400).json({ success: false, message: "Aap khud ko follow nahi kar sakte" });
    }

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: userIdToFollow },
    });

    await User.findByIdAndUpdate(userIdToFollow, {
      $addToSet: { followers: currentUserId },
    });

    return res.status(200).json({ success: true, message: "Successfully followed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};