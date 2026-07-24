const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const ConnectUser = require('../models/ConnectUser');

// GET /api/connect/search?q=CX102938
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rawQuery = req.query.q ? req.query.q.trim() : '';
    const currentUserId = req.user.id;

    if (!rawQuery) {
      return res.json({ users: [] });
    }

    const cleanQuery = rawQuery.toLowerCase();
    // Also extract numeric part if user searched for "102938" without "CX"
    const numericPart = rawQuery.replace(/\D/g, '');

    if (db.isMongoConnected()) {
      const regexConditions = [
        { userId: { $regex: cleanQuery, $options: 'i' } },
        { username: { $regex: cleanQuery, $options: 'i' } },
        { fullName: { $regex: cleanQuery, $options: 'i' } },
        { email: { $regex: cleanQuery, $options: 'i' } }
      ];

      if (numericPart) {
        regexConditions.push({ userId: { $regex: numericPart, $options: 'i' } });
      }

      const users = await ConnectUser.find({
        _id: { $ne: currentUserId },
        $or: regexConditions
      }).limit(50);

      return res.json({ users });
    } else {
      const users = db.usersStore.find(u => {
        const isSelf = u._id === currentUserId || u.id === currentUserId || (u.userId && u.userId === req.user.userId);
        if (isSelf) return false;

        const userIdStr = (u.userId || '').toLowerCase();
        const usernameStr = (u.username || '').toLowerCase();
        const fullNameStr = (u.fullName || '').toLowerCase();
        const emailStr = (u.email || '').toLowerCase();

        const matchUserId = userIdStr.includes(cleanQuery) || (numericPart && userIdStr.includes(numericPart));
        const matchUsername = usernameStr.includes(cleanQuery);
        const matchFullName = fullNameStr.includes(cleanQuery);
        const matchEmail = emailStr.includes(cleanQuery);

        return matchUserId || matchUsername || matchFullName || matchEmail;
      });

      return res.json({ users });
    }
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
