import jwt from 'jsonwebtoken';

/**
 * Generate a JWT for a given user ID.
 * @param {string} userId - The MongoDB ObjectId of the user.
 * @returns {string} - Signed JWT token (expires in 1 day).
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

export default generateToken;
