const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

// GET /api/connect/friends (Fetch friends list and pending requests)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const allUsers = db.usersStore.get();
    const currentUser = db.usersStore.findById(userId);

    const friendIds = currentUser?.friends || [];
    const blockedIds = currentUser?.blockedUsers || [];

    const friends = allUsers.filter(u => friendIds.includes(u._id));
    const requests = db.notificationsStore.find(n => n.recipientId === userId && n.type === 'friend_request' && n.status === 'pending');

    res.json({ friends, requests, blockedIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// POST /api/connect/friends/request (Send friend request)
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const senderId = req.user.id;

    if (senderId === targetUserId) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }

    const sender = db.usersStore.findById(senderId);
    const target = db.usersStore.findById(targetUserId);

    if (!target) return res.status(404).json({ error: 'User not found' });

    // Save friend request notification
    const newRequest = db.notificationsStore.insertOne({
      senderId,
      senderName: sender.fullName,
      senderAvatar: sender.avatar,
      senderUserId: sender.userId,
      recipientId: targetUserId,
      type: 'friend_request',
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, request: newRequest });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// POST /api/connect/friends/accept
router.post('/accept', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = db.notificationsStore.findById(requestId);

    if (!request || request.recipientId !== req.user.id) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const user1 = db.usersStore.findById(req.user.id);
    const user2 = db.usersStore.findById(request.senderId);

    if (user1 && user2) {
      const friends1 = Array.from(new Set([...(user1.friends || []), user2._id]));
      const friends2 = Array.from(new Set([...(user2.friends || []), user1._id]));

      db.usersStore.updateOne(user1._id, { friends: friends1 });
      db.usersStore.updateOne(user2._id, { friends: friends2 });
      db.notificationsStore.updateOne(requestId, { status: 'accepted' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// POST /api/connect/friends/block
router.post('/block', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUser = db.usersStore.findById(req.user.id);

    const blocked = Array.from(new Set([...(currentUser.blockedUsers || []), targetUserId]));
    const friends = (currentUser.friends || []).filter(id => id !== targetUserId);

    db.usersStore.updateOne(req.user.id, { blockedUsers: blocked, friends });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block user' });
  }
});

module.exports = router;
