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

// POST /api/connect/auth/google (Google / Email Login & Auto-Registration)
router.post('/google', async (req, res) => {
  try {
    let { email, fullName, username, avatar } = req.body;
    if (!fullName && !username && !email) {
      return res.status(400).json({ error: 'Name or email is required for login' });
    }

    const cleanFullName = (fullName || username || (email ? email.split('@')[0] : 'ConnectUser')).trim();
    const rawEmail = (email || `${cleanFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@connectx.com`).trim().toLowerCase();
    const cleanEmail = rawEmail;
    const cleanUsername = (username || rawEmail.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (db.isMongoConnected()) {
      // Find existing account case-insensitively by email OR username
      let user = await ConnectUser.findOne({
        $or: [
          { email: { $regex: `^${cleanEmail}$`, $options: 'i' } },
          { username: { $regex: `^${cleanUsername}$`, $options: 'i' } }
        ]
      });

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
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`,
          bio: 'Hey there! I am using ConnectX.',
          country: 'United States',
          status: 'online',
          joinDate: new Date()
        });
      } else {
        if (cleanFullName && user.fullName !== cleanFullName) {
          user.fullName = cleanFullName;
        }
        if (avatar) user.avatar = avatar;
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been banned by Administrator.' });
      }

      const userIdVal = user._id || user.id || user.userId;
      const token = jwt.sign(
        { id: userIdVal, userId: user.userId, email: user.email, username: user.username, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({ token, user });
    } else {
      // Fallback JSON DB mode - Robust Case-insensitive lookup by email or username
      let user = db.usersStore.findOne(u => 
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        (cleanEmail && u.email && u.email.split('@')[0].toLowerCase() === cleanEmail.split('@')[0])
      );

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
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`,
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
        const targetId = user._id || user.id || user.userId;
        const updatedUser = db.usersStore.updateOne(targetId, {
          fullName: cleanFullName || user.fullName,
          avatar: avatar || user.avatar,
          status: 'online',
          lastSeen: new Date().toISOString()
        });
        if (updatedUser) {
          user = updatedUser;
        } else {
          user.fullName = cleanFullName || user.fullName;
          if (avatar) user.avatar = avatar;
          user.status = 'online';
          user.lastSeen = new Date().toISOString();
        }
      }

      if (!user) {
        return res.status(500).json({ error: 'User initialization error. Please try again.' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been banned by Administrator.' });
      }

      const userIdVal = user._id || user.id || user.userId;
      const token = jwt.sign(
        { id: userIdVal, userId: user.userId, email: user.email, username: user.username, role: user.role || 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({ token, user });
    }
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Authentication failed. Please check inputs' });
  }
});

// GET /api/connect/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const searchId = req.user.id || req.user._id || req.user.userId;
    if (db.isMongoConnected()) {
      const user = await ConnectUser.findOne({
        $or: [{ _id: searchId }, { userId: searchId }, { email: req.user.email }]
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } else {
      let user = db.usersStore.findById(searchId);
      if (!user) {
        user = db.usersStore.findOne(u => u.userId === searchId || (u.email && u.email === req.user.email));
      }
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

    const searchId = req.user.id || req.user._id || req.user.userId;

    if (db.isMongoConnected()) {
      let user = await ConnectUser.findByIdAndUpdate(searchId, updates, { new: true });
      if (!user) {
        user = await ConnectUser.findOneAndUpdate({ userId: searchId }, updates, { new: true });
      }
      return res.json({ user });
    } else {
      let user = db.usersStore.updateOne(searchId, updates);
      if (!user) {
        const existing = db.usersStore.findOne(u => u.userId === searchId || (u.email && u.email === req.user.email));
        if (existing) {
          user = db.usersStore.updateOne(existing._id || existing.id, updates);
        }
      }
      if (!user) {
        user = db.usersStore.findById(searchId);
      }
      return res.json({ user });
    }
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
