const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const db = require('../db');
const ConnectUser = require('../models/ConnectUser');

// Helper to generate unique User ID (CX102938 format)
function generateUniqueId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `CX${randomNum}`;
}

// POST /api/connect/auth/google
router.post('/google', async (req, res) => {
  try {
    let { email, fullName, username, avatar } = req.body;
    if (!fullName && !username && !email) {
      return res.status(400).json({ error: 'Name is required for registration' });
    }

    const cleanFullName = (fullName || username || 'ConnectUser').trim();
    const cleanUsername = (username || (email ? email.split('@')[0] : cleanFullName)).toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = (email || `${cleanUsername}@connectx.com`).toLowerCase().trim();

    if (db.isMongoConnected()) {
      let user = await ConnectUser.findOne({ email: cleanEmail });
      if (!user) {
        let uniqueUserId = generateUniqueId();
        let existingId = await ConnectUser.findOne({ userId: uniqueUserId });
        while (existingId) {
          uniqueUserId = generateUniqueId();
          existingId = await ConnectUser.findOne({ userId: uniqueUserId });
        }

        user = await ConnectUser.create({
          userId: uniqueUserId,
          email: cleanEmail,
          fullName: cleanFullName,
          username: cleanUsername,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          bio: 'Hey there! I am using ConnectX.',
          country: 'United States',
          status: 'online',
          joinDate: new Date()
        });
      } else {
        user.fullName = cleanFullName || user.fullName;
        if (avatar) user.avatar = avatar;
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been banned by Administrator.' });
      }

      const token = jwt.sign(
        { id: user._id, userId: user.userId, email: user.email, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({ token, user });
    } else {
      let user = db.usersStore.findOne(u => u.email === cleanEmail || u.username === cleanUsername);
      if (!user) {
        let uniqueUserId = generateUniqueId();
        while (db.usersStore.findOne(u => u.userId === uniqueUserId)) {
          uniqueUserId = generateUniqueId();
        }

        user = db.usersStore.insertOne({
          userId: uniqueUserId,
          email: cleanEmail,
          fullName: cleanFullName,
          username: cleanUsername,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
          coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
          bio: 'Hey there! I am using ConnectX.',
          country: 'United States',
          role: cleanEmail.includes('admin') ? 'admin' : 'user',
          status: 'online',
          lastSeen: new Date().toISOString(),
          joinDate: new Date().toISOString(),
          isBanned: false,
          friends: [],
          blockedUsers: []
        });
      } else {
        user = db.usersStore.updateOne(user._id, {
          fullName: cleanFullName || user.fullName,
          avatar: avatar || user.avatar,
          status: 'online',
          lastSeen: new Date().toISOString()
        });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been banned by Administrator.' });
      }

      const token = jwt.sign(
        { id: user._id, userId: user.userId, email: user.email, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({ token, user });
    }
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/connect/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (db.isMongoConnected()) {
      const user = await ConnectUser.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } else {
      const user = db.usersStore.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/connect/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, bio, avatar, coverPhoto, country } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (coverPhoto) updates.coverPhoto = coverPhoto;
    if (country) updates.country = country;

    if (db.isMongoConnected()) {
      const user = await ConnectUser.findByIdAndUpdate(req.user.id, updates, { new: true });
      return res.json({ user });
    } else {
      const user = db.usersStore.updateOne(req.user.id, updates);
      return res.json({ user });
    }
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
