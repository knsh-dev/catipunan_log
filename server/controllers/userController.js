// server/controllers/userController.js
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// ── GET /api/users ────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await sequelize.query(
      `SELECT user_id, full_name, username, email, role, created_at
       FROM \`USER\`
       ORDER BY user_id ASC`,
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// ── PUT /api/users/:id ────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, username, email, role, password } = req.body;

    if (!full_name || !username || !email || !role) {
      return res.status(400).json({ message: 'Full name, username, email, and role are required.' });
    }

    const validRoles = ['admin', 'cashier', 'staff'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    // Check username uniqueness (exclude current user)
    const [dupUsername] = await sequelize.query(
      `SELECT user_id FROM \`USER\` WHERE username = :username AND user_id != :id`,
      { replacements: { username, id }, type: QueryTypes.SELECT }
    );
    if (dupUsername) {
      return res.status(409).json({ message: 'Username already taken by another user.' });
    }

    // Check email uniqueness (exclude current user)
    const [dupEmail] = await sequelize.query(
      `SELECT user_id FROM \`USER\` WHERE email = :email AND user_id != :id`,
      { replacements: { email, id }, type: QueryTypes.SELECT }
    );
    if (dupEmail) {
      return res.status(409).json({ message: 'Email already registered by another user.' });
    }

    // Build update — optionally update password if provided
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password.trim(), salt);
      await sequelize.query(
        `UPDATE \`USER\`
         SET full_name = :full_name, username = :username, email = :email,
             role = :role, password_hash = :password_hash
         WHERE user_id = :id`,
        { replacements: { full_name, username, email, role: role.toLowerCase(), password_hash, id }, type: QueryTypes.UPDATE }
      );
    } else {
      await sequelize.query(
        `UPDATE \`USER\`
         SET full_name = :full_name, username = :username, email = :email, role = :role
         WHERE user_id = :id`,
        { replacements: { full_name, username, email, role: role.toLowerCase(), id }, type: QueryTypes.UPDATE }
      );
    }

    // Return updated user
    const [updated] = await sequelize.query(
      `SELECT user_id, full_name, username, email, role, created_at FROM \`USER\` WHERE user_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!updated) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ message: 'User updated successfully.', user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ message: 'Failed to update user.' });
  }
};

// ── DELETE /api/users/:id ─────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    // Block self-deletion
    if (parseInt(id) === parseInt(requesterId)) {
      return res.status(403).json({ message: 'You cannot delete your own account.' });
    }

    const [count] = await sequelize.query(
      `DELETE FROM \`USER\` WHERE user_id = :id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    if (count === 0) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ message: 'Failed to delete user.' });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser };
