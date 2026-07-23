const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const Assignment = require('../models/Assignment');

// GET /api/assignments?courseId=xyz
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;

    if (db.isMongoConnected()) {
      const query = courseId ? { courseId } : {};
      const assignments = await Assignment.find(query).sort({ createdAt: -1 });
      return res.json({ assignments });
    } else {
      let assignments = db.assignmentsStore.get();
      if (courseId) {
        assignments = assignments.filter(a => a.courseId === courseId);
      }
      assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ assignments });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/assignments (Teacher creates homework)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only teachers can create assignments' });
    }

    const { title, description, courseId, courseName, dueDate, attachments } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and Due Date are required' });
    }

    if (db.isMongoConnected()) {
      const newAssignment = await Assignment.create({
        title,
        description: description || '',
        courseId: courseId || 'general',
        courseName: courseName || 'General Course',
        teacherId: req.user.id,
        teacherName: req.user.username,
        dueDate: new Date(dueDate),
        attachments: attachments || [],
        submissions: []
      });
      return res.json({ assignment: newAssignment });
    } else {
      const newAssignment = db.assignmentsStore.insertOne({
        title,
        description: description || '',
        courseId: courseId || 'general',
        courseName: courseName || 'General Course',
        teacherId: req.user.id,
        teacherName: req.user.username,
        dueDate: new Date(dueDate).toISOString(),
        attachments: attachments || [],
        submissions: []
      });
      return res.json({ assignment: newAssignment });
    }
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// POST /api/assignments/:id/submit (Student submits homework)
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { comment, fileUrl, fileName } = req.body;

    const submissionData = {
      studentId: req.user.id,
      studentName: req.user.username,
      studentAvatar: req.user.avatar || '',
      fileUrl: fileUrl || '',
      fileName: fileName || '',
      comment: comment || '',
      submittedAt: new Date().toISOString(),
      grade: 'Pending',
      feedback: ''
    };

    if (db.isMongoConnected()) {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      // Remove previous submission by same student if any
      assignment.submissions = assignment.submissions.filter(s => s.studentId !== req.user.id);
      assignment.submissions.push(submissionData);
      await assignment.save();
      return res.json({ assignment });
    } else {
      const assignment = db.assignmentsStore.findById(assignmentId);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      let submissions = assignment.submissions || [];
      submissions = submissions.filter(s => s.studentId !== req.user.id);
      submissions.push(submissionData);

      const updated = db.assignmentsStore.updateOne(assignmentId, { submissions });
      return res.json({ assignment: updated });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit homework' });
  }
});

// PUT /api/assignments/:id/grade (Teacher grades submission)
router.put('/:id/grade', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only teachers can grade homework' });
    }

    const assignmentId = req.params.id;
    const { studentId, grade, feedback } = req.body;

    if (db.isMongoConnected()) {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      const subIndex = assignment.submissions.findIndex(s => s.studentId === studentId);
      if (subIndex !== -1) {
        assignment.submissions[subIndex].grade = grade;
        assignment.submissions[subIndex].feedback = feedback || '';
        await assignment.save();
      }
      return res.json({ assignment });
    } else {
      const assignment = db.assignmentsStore.findById(assignmentId);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      let submissions = assignment.submissions || [];
      const subIndex = submissions.findIndex(s => s.studentId === studentId);
      if (subIndex !== -1) {
        submissions[subIndex].grade = grade;
        submissions[subIndex].feedback = feedback || '';
        db.assignmentsStore.updateOne(assignmentId, { submissions });
      }
      return res.json({ assignment });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

module.exports = router;
