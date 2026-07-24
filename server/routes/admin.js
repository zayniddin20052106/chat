const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const ConnectUser = require('../models/ConnectUser');
const Group = require('../models/Group');
const ConnectMessage = require('../models/ConnectMessage');

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
      const totalUsers = await ConnectUser.countDocuments();
      const onlineUsers = await ConnectUser.countDocuments({ status: 'online' });
      const totalMessages = await ConnectMessage.countDocuments();
      const totalGroups = await Group.countDocuments();
      return res.json({ stats: { totalUsers, onlineUsers, totalMessages, totalGroups } });
    } else {
      const allUsers = db.usersStore.get();
      const totalUsers = allUsers.length;
      const onlineUsers = allUsers.filter(u => u.status === 'online').length;
      const totalMessages = db.messagesStore.get().length;
      const totalGroups = db.groupsStore.get().length;
      return res.json({ stats: { totalUsers, onlineUsers, totalMessages, totalGroups } });
    }
  } catch (err) {
    console.error('Fetch admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (db.isMongoConnected()) {
      const users = await ConnectUser.find().select('-password').sort({ joinDate: -1 });
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

      const user = await ConnectUser.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
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

// POST /api/admin/broadcast (Post Official Announcement to All Users)
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { text, title } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Announcement message text is required' });
    }

    const io = req.app.get('io');
    const adminUser = req.user;

    // Find or create official announcements channel
    let announcementsChannel;
    if (db.isMongoConnected()) {
      announcementsChannel = await Group.findOne({ courseCode: 'CX-ANNOUNCEMENTS' });
      if (!announcementsChannel) {
        announcementsChannel = await Group.create({
          name: '📢 ConnectX Official Announcements',
          description: 'Official news, system updates, and platform announcements',
          avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ConnectXNews',
          type: 'public_channel',
          creatorId: adminUser.id,
          courseCode: 'CX-ANNOUNCEMENTS',
          members: []
        });
      }

      const newMsg = await ConnectMessage.create({
        senderId: adminUser.id,
        senderName: '📢 ConnectX Official News',
        senderUsername: 'connectx_news',
        senderAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ConnectXNews',
        senderUserId: 'CX000000',
        channelId: announcementsChannel._id,
        text: text.trim(),
        createdAt: new Date()
      });

      if (io) {
        io.emit('receive_message', newMsg);
      }

      return res.json({ message: newMsg, channel: announcementsChannel });
    } else {
      announcementsChannel = db.groupsStore.findOne(g => g.courseCode === 'CX-ANNOUNCEMENTS');
      if (!announcementsChannel) {
        announcementsChannel = db.groupsStore.insertOne({
          name: '📢 ConnectX Official Announcements',
          description: 'Official news, system updates, and platform announcements',
          avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ConnectXNews',
          type: 'public_channel',
          creatorId: adminUser.id,
          courseCode: 'CX-ANNOUNCEMENTS',
          members: []
        });
      }

      const newMsg = db.messagesStore.insertOne({
        senderId: adminUser.id,
        senderName: '📢 ConnectX Official News',
        senderUsername: 'connectx_news',
        senderAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ConnectXNews',
        senderUserId: 'CX000000',
        channelId: announcementsChannel._id || announcementsChannel.id,
        text: text.trim(),
        createdAt: new Date().toISOString()
      });

      if (io) {
        io.emit('receive_message', newMsg);
      }

      return res.json({ message: newMsg, channel: announcementsChannel });
    }
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Broadcast announcement failed' });
  }
});

module.exports = router;
