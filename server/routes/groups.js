const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const Group = require('../models/Group');
const User = require('../models/User');

// GET /api/groups/list (User's chats, groups, courses, channels & all users)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (db.isMongoConnected()) {
      const allUsers = await User.find({ _id: { $ne: userId } }).select('-password');
      const groups = await Group.find({
        $or: [
          { members: userId },
          { type: 'channel' } // Public channels accessible to all
        ]
      });

      return res.json({ users: allUsers, groups });
    } else {
      const allUsers = db.usersStore.find(u => u._id !== userId)
        .map(({ password, ...rest }) => rest);
      
      const groups = db.groupsStore.find(g => 
        (g.members && g.members.includes(userId)) || g.type === 'channel'
      );

      return res.json({ users: allUsers, groups });
    }
  } catch (err) {
    console.error('Fetch chats list error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// POST /api/groups (Create Group / Course / Channel)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, avatar, type, courseCode } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const groupType = type || 'group';

    // Channel creation rule: only teachers/admins can create channels or courses
    if ((groupType === 'channel' || groupType === 'course') && req.user.role === 'student') {
      return res.status(403).json({ error: 'Only Teachers and Admins can create Courses and Channels' });
    }

    if (db.isMongoConnected()) {
      const newGroup = await Group.create({
        name,
        description: description || '',
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        type: groupType,
        creatorId: req.user.id,
        teacherId: req.user.role === 'teacher' ? req.user.id : '',
        courseCode: courseCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [req.user.id],
        admins: [req.user.id]
      });
      return res.json({ group: newGroup });
    } else {
      const newGroup = db.groupsStore.insertOne({
        name,
        description: description || '',
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        type: groupType,
        creatorId: req.user.id,
        teacherId: req.user.role === 'teacher' ? req.user.id : '',
        courseCode: courseCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: [req.user.id],
        admins: [req.user.id]
      });
      return res.json({ group: newGroup });
    }
  } catch (err) {
    console.error('Group creation error:', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// POST /api/groups/join (Join course/group by code)
router.post('/join', authenticateToken, async (req, res) => {
  try {
    const { courseCode } = req.body;
    if (!courseCode) {
      return res.status(400).json({ error: 'Course/Group code required' });
    }

    const cleanCode = courseCode.trim().toUpperCase();

    if (db.isMongoConnected()) {
      const group = await Group.findOne({ courseCode: cleanCode });
      if (!group) return res.status(404).json({ error: 'Course or Group not found' });

      if (!group.members.includes(req.user.id)) {
        group.members.push(req.user.id);
        await group.save();
      }
      return res.json({ group });
    } else {
      const group = db.groupsStore.findOne(g => g.courseCode === cleanCode);
      if (!group) return res.status(404).json({ error: 'Course or Group not found' });

      const members = group.members || [];
      if (!members.includes(req.user.id)) {
        members.push(req.user.id);
        db.groupsStore.updateOne(group._id, { members });
      }
      return res.json({ group });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to join' });
  }
});

module.exports = router;
