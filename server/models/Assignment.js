const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  studentAvatar: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  comment: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String, default: 'Pending' }, // e.g. "A+", "95/100", "Pending"
  feedback: { type: String, default: '' }
});

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  courseId: { type: String, required: true },
  courseName: { type: String, default: 'General Course' },
  teacherId: { type: String, required: true },
  teacherName: { type: String, required: true },
  dueDate: { type: Date, required: true },
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String
  }],
  submissions: [SubmissionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
