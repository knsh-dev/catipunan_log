// server/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'catipunan_secret_2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // ── Basic input validation ──
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required.' });
    }

    // ── Find user by username ──
    const user = await User.findOne({ where: { username: username.trim() } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // ── Verify role matches ──
    if (user.role !== role.toLowerCase()) {
      return res.status(403).json({ message: `This account is not registered as ${role}.` });
    }

    // ── Verify password ──
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // ── Generate JWT ──
    const payload = {
      id:       user.user_id,
      username: user.username,
      role:     user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // ── Respond ──
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id:        user.user_id,
        full_name: user.full_name,
        username:  user.username,
        email:     user.email,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error('Login error FULL:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// POST /api/auth/register  (Admin use — creates new staff/cashier/admin accounts)
const register = async (req, res) => {
  try {
    const { full_name, email, username, password, role } = req.body;

    if (!full_name || !email || !username || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const validRoles = ['admin', 'cashier', 'staff'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, cashier, or staff.' });
    }

    // Check uniqueness
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      full_name,
      email,
      username,
      password_hash,
      role: role.toLowerCase(),
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id:        newUser.user_id,
        full_name: newUser.full_name,
        username:  newUser.username,
        email:     newUser.email,
        role:      newUser.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

module.exports = { login, register };