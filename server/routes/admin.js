const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Assignment = require('../models/Assignment');

// Middleware to ensure admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (db.isMongoConnected()) {
      const totalUsers = await User.countDocuments();
      const totalMessages = await Message.countDocuments();
      const totalGroups = await Group.countDocuments();
      const totalAssignments = await Assignment.countDocuments();
      return res.json({ stats: { totalUsers, totalMessages, totalGroups, totalAssignments } });
    } else {
      const totalUsers = db.usersStore.get().length;
      const totalMessages = db.messagesStore.get().length;
      const totalGroups = db.groupsStore.get().length;
      const totalAssignments = db.assignmentsStore.get().length;
      return res.json({ stats: { totalUsers, totalMessages, totalGroups, totalAssignments } });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (db.isMongoConnected()) {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.json({ users });
    } else {
      const users = db.usersStore.get().map(({ password, ...u }) => u);
      return res.json({ users });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, isBanned } = req.body;
    const userId = req.params.id;

    if (db.isMongoConnected()) {
      const updates = {};
      if (role) updates.role = role;
      if (isBanned !== undefined) updates.isBanned = isBanned;

      const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
      return res.json({ user });
    } else {
      const updates = {};
      if (role) updates.role = role;
      if (isBanned !== undefined) updates.isBanned = isBanned;

      const updatedUser = db.usersStore.updateOne(userId, updates);
      const { password, ...safe } = updatedUser;
      return res.json({ user: safe });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE /api/admin/messages/:id (Delete inappropriate message)
router.delete('/messages/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messageId = req.params.id;
    if (db.isMongoConnected()) {
      await Message.findByIdAndDelete(messageId);
    } else {
      db.messagesStore.deleteOne(messageId);
    }
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
