// server/routes/users.js
const express = require('express');
const router  = express.Router();

const { protect, restrictTo }          = require('../middleware/authMiddleware');
const { getAllUsers, updateUser, deleteUser } = require('../controllers/userController');

// All routes: admin only
router.get('/',      protect, restrictTo('admin'), getAllUsers);
router.put('/:id',   protect, restrictTo('admin'), updateUser);
router.delete('/:id',protect, restrictTo('admin'), deleteUser);

module.exports = router;
