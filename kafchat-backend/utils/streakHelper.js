/**
 * Snapchat-style streak logic for 1-on-1 chats.
 *
 * Rules:
 * - Streak increments when BOTH participants have sent at least one message
 *   within the current 24–48h rolling window since it was last updated.
 * - If more than 48h pass without both sides messaging, streak resets to 0.
 * - Only meaningful for 1-on-1 (non-group) chats.
 *
 * @param {Object} chat - Mongoose Chat document
 * @param {String} senderId - ID of the user who just sent a message
 * @returns {Object} updated streak object (not yet saved)
 */
const updateStreak = (chat, senderId) => {
  if (chat.isGroupChat) return chat.streak; // streaks only apply to 1-1 chats

  const now = new Date();
  const HOUR = 60 * 60 * 1000;
  const senderIdStr = senderId.toString();

  const { lastUpdatedDate, lastSenders = [], count = 0 } = chat.streak || {};

  // First message ever in this chat
  if (!lastUpdatedDate) {
    chat.streak = {
      count: 0,
      lastUpdatedDate: now,
      lastSenders: [senderIdStr],
    };
    return chat.streak;
  }

  const hoursSinceUpdate = (now - new Date(lastUpdatedDate)) / HOUR;

  // Streak broken — more than 48h since last update with no reciprocal message
  if (hoursSinceUpdate > 48) {
    chat.streak = {
      count: 0,
      lastUpdatedDate: now,
      lastSenders: [senderIdStr],
    };
    return chat.streak;
  }

  const alreadySentInWindow = lastSenders.map(String).includes(senderIdStr);

  // Same sender messaging again within window — no change yet, just log
  if (alreadySentInWindow) {
    return chat.streak;
  }

  const updatedSenders = [...new Set([...lastSenders.map(String), senderIdStr])];
  const otherParticipant = chat.participants.find((p) => p.toString() !== senderIdStr);

  // Both participants have now messaged within the 24-48h window -> increment
  if (updatedSenders.length >= 2 && hoursSinceUpdate >= 24 && hoursSinceUpdate <= 48) {
    chat.streak = {
      count: count + 1,
      lastUpdatedDate: now,
      lastSenders: [senderIdStr],
    };
  } else {
    chat.streak = {
      count,
      lastUpdatedDate: chat.streak.lastUpdatedDate,
      lastSenders: updatedSenders,
    };
  }

  return chat.streak;
};

module.exports = { updateStreak };
