const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for a given user id.
 * @param {string} userId - Mongo ObjectId of the user
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

module.exports = generateToken;
