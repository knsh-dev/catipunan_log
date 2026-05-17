// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login',    login);
router.post('/register', register);

// Protected: verify current session / get own profile
router.get('/me', protect, async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id, {
      attributes: ['user_id', 'full_name', 'username', 'email', 'role'],
    });
    if (!user) return res.status(401).json({ message: 'User not found.' });
    res.status(200).json({
      user: {
        id:        user.user_id,
        full_name: user.full_name,
        username:  user.username,
        email:     user.email,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error('/me error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;