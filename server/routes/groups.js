const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const Group = require('../models/Group');
const ConnectUser = require('../models/ConnectUser');

// GET /api/groups/list (User's chats, groups, courses, channels & all users)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (db.isMongoConnected()) {
      const allUsers = await ConnectUser.find({ _id: { $ne: userId } }).select('-password');
      const groups = await Group.find({
        $or: [
          { members: userId },
          { creatorId: userId },
          { type: { $in: ['channel', 'public_channel', 'group', 'course'] } }
        ]
      });

      return res.json({ users: allUsers, groups });
    } else {
      const allUsers = db.usersStore.find(u => u._id !== userId && u.id !== userId)
        .map(({ password, ...rest }) => rest);

      // Find all users this user has messaged with
      const userMessages = db.messagesStore.find(m => m.senderId === userId || m.recipientId === userId);
      const contactedUserIds = new Set();
      userMessages.forEach(m => {
        if (m.senderId && m.senderId !== userId) contactedUserIds.add(m.senderId);
        if (m.recipientId && m.recipientId !== userId) contactedUserIds.add(m.recipientId);
      });

      // Sort users so contacted ones appear first
      allUsers.sort((a, b) => {
        const aContact = contactedUserIds.has(a._id || a.id) ? 1 : 0;
        const bContact = contactedUserIds.has(b._id || b.id) ? 1 : 0;
        return bContact - aContact;
      });

      const groups = db.groupsStore.find(g => 
        (g.members && g.members.includes(userId)) || 
        g.creatorId === userId ||
        g.type === 'channel' || 
        g.type === 'public_channel' ||
        g.type === 'group'
      );

      return res.json({ users: allUsers, groups });
    }
  } catch (err) {
    console.error('Fetch chats list error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// POST /api/groups (Create Group / Course / Channel with selected members)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, avatar, type, courseCode, selectedMemberIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const groupType = type || 'group';
    const creatorId = req.user.id;
    
    // Combine creator with any selected member IDs
    const membersList = Array.from(new Set([creatorId, ...(selectedMemberIds || [])]));

    const generatedCode = courseCode || 'CX-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    if (db.isMongoConnected()) {
      const newGroup = await Group.create({
        name: name.trim(),
        description: description ? description.trim() : '',
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        type: groupType,
        creatorId,
        courseCode: generatedCode,
        members: membersList,
        admins: [creatorId]
      });
      return res.json({ group: newGroup });
    } else {
      const newGroup = db.groupsStore.insertOne({
        name: name.trim(),
        description: description ? description.trim() : '',
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        type: groupType,
        creatorId,
        courseCode: generatedCode,
        members: membersList,
        admins: [creatorId]
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
        db.groupsStore.updateOne(group._id || group.id, { members });
      }
      return res.json({ group });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to join' });
  }
});

// POST /api/groups/:id/members (Add people to existing group)
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { userIdsToAdd } = req.body;

    if (!userIdsToAdd || !Array.isArray(userIdsToAdd)) {
      return res.status(400).json({ error: 'User IDs array required' });
    }

    if (db.isMongoConnected()) {
      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ error: 'Group not found' });

      userIdsToAdd.forEach(uId => {
        if (!group.members.includes(uId)) group.members.push(uId);
      });
      await group.save();
      return res.json({ group });
    } else {
      const group = db.groupsStore.findById(groupId) || db.groupsStore.findOne(g => g._id === groupId || g.id === groupId);
      if (!group) return res.status(404).json({ error: 'Group not found' });

      const members = Array.from(new Set([...(group.members || []), ...userIdsToAdd]));
      const updated = db.groupsStore.updateOne(group._id || group.id, { members });
      return res.json({ group: updated });
    }
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

module.exports = router;
