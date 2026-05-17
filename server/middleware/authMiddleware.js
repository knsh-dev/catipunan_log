// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'catipunan_secret_2026';

/**
 * Verifies the Bearer JWT token from the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in.' });
  }
};

/**
 * Restricts access to specific roles.
 * Usage: router.get('/admin-only', protect, restrictTo('admin'), handler)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Only ${roles.join(', ')} can perform this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };