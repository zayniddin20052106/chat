const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const ConnectUser = require('../models/ConnectUser');

// GET /api/connect/search?q=CX102938
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim().toLowerCase() : '';
    const currentUserId = req.user.id;

    if (!query) {
      return res.json({ users: [] });
    }

    if (db.isMongoConnected()) {
      const users = await ConnectUser.find({
        _id: { $ne: currentUserId },
        $or: [
          { userId: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } }
        ]
      }).limit(30);

      return res.json({ users });
    } else {
      const users = db.usersStore.find(u => 
        u._id !== currentUserId &&
        (
          (u.userId && u.userId.toLowerCase().includes(query)) ||
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.fullName && u.fullName.toLowerCase().includes(query))
        )
      );

      return res.json({ users });
    }
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
