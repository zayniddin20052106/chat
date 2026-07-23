const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const db = require('../db');
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, avatar, bio } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim();

    if (db.isMongoConnected()) {
      const existing = await User.findOne({ username: cleanUsername });
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username: cleanUsername,
        password: hashedPassword,
        role: role || 'student',
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        bio: bio || 'Hello! I am using EduChat.',
        status: 'online'
      });

      const token = jwt.sign(
        { id: newUser._id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          avatar: newUser.avatar,
          bio: newUser.bio,
          status: newUser.status
        }
      });
    } else {
      // JSON storage fallback
      const existing = db.usersStore.findOne(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = db.usersStore.insertOne({
        username: cleanUsername,
        password: hashedPassword,
        role: role || 'student',
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        bio: bio || 'Hello! I am using EduChat.',
        status: 'online',
        lastSeen: new Date().toISOString(),
        isBanned: false
      });

      const token = jwt.sign(
        { id: newUser._id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          role: newUser.role,
          avatar: newUser.avatar,
          bio: newUser.bio,
          status: newUser.status
        }
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const cleanUsername = username.trim();

    if (db.isMongoConnected()) {
      const user = await User.findOne({ username: cleanUsername });
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been suspended by Admin' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      user.status = 'online';
      user.lastSeen = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status
        }
      });
    } else {
      const user = db.usersStore.findOne(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: 'Your account has been suspended by Admin' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      db.usersStore.updateOne(user._id, { status: 'online', lastSeen: new Date().toISOString() });

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          status: 'online'
        }
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (db.isMongoConnected()) {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ user });
    } else {
      const user = db.usersStore.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { password, ...safeUser } = user;
      return res.json({ user: safeUser });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { bio, avatar, status } = req.body;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (status !== undefined) updates.status = status;

    if (db.isMongoConnected()) {
      const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      return res.json({ user: updatedUser });
    } else {
      const updatedUser = db.usersStore.updateOne(req.user.id, updates);
      const { password, ...safeUser } = updatedUser;
      return res.json({ user: safeUser });
    }
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
