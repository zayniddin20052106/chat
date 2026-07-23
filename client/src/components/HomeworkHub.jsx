import React, { useState, useEffect } from 'react';
import { 
  BookMarked, Plus, FileText, CheckCircle2, Clock, 
  Upload, Award, X, Sparkles, AlertCircle, ChevronRight 
} from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

export default function HomeworkHub({ currentUser, groups, onClose }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New assignment form state (Teacher)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('general');
  const [dueDate, setDueDate] = useState('');
  
  // Submission form state (Student)
  const [submissionComment, setSubmissionComment] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Grading form state (Teacher)
  const [gradeInput, setGradeInput] = useState('A+');
  const [feedbackInput, setFeedbackInput] = useState('Great work!');

  const token = localStorage.getItem('educhat_token');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data.assignments);
      if (res.data.assignments.length > 0 && !selectedAssignment) {
        setSelectedAssignment(res.data.assignments[0]);
      }
    } catch (err) {
      console.error('Fetch assignments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      const selectedCourse = groups.find(g => g._id === courseId);
      const res = await axios.post('/api/assignments', {
        title,
        description,
        courseId,
        courseName: selectedCourse ? selectedCourse.name : 'General Course',
        dueDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments([res.data.assignment, ...assignments]);
      setSelectedAssignment(res.data.assignment);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      alert('Failed to create assignment');
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      let fileUrl = '';
      let fileName = '';

      if (submissionFile) {
        const formData = new FormData();
        formData.append('file', submissionFile);
        const uploadRes = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        fileUrl = uploadRes.data.fileUrl;
        fileName = uploadRes.data.fileName;
      }

      const res = await axios.post(`/api/assignments/${selectedAssignment._id}/submit`, {
        comment: submissionComment,
        fileUrl,
        fileName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedAssignment(res.data.assignment);
      fetchAssignments();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      alert('Homework submitted successfully!');
    } catch (err) {
      alert('Homework submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeSubmission = async (studentId) => {
    if (!selectedAssignment) return;
    try {
      const res = await axios.put(`/api/assignments/${selectedAssignment._id}/grade`, {
        studentId,
        grade: gradeInput,
        feedback: feedbackInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedAssignment(res.data.assignment);
      fetchAssignments();
      alert('Submission graded successfully!');
    } catch (err) {
      alert('Grading failed');
    }
  };

  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-white dark:bg-telegram-darkCard rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        
        {/* Top Navigation */}
        <header className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <BookMarked className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">EduChat Homework Hub</h2>
              <p className="text-xs text-indigo-100">
                {isTeacherOrAdmin ? 'Manage assignments and evaluate student submissions' : 'Submit assignments and track grades'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Homework</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Assignment List Side */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-telegram-darkSidebar overflow-y-auto">
            <div className="p-3 font-semibold text-xs text-gray-500 uppercase tracking-wider">
              Assignments List ({assignments.length})
            </div>
            {assignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No assignments created yet.
              </div>
            ) : (
              assignments.map((item) => {
                const isSelected = selectedAssignment?._id === item._id;
                const mySubmission = item.submissions?.find(s => s.studentId === currentUser?.id || s.studentId === currentUser?._id);
                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedAssignment(item)}
                    className={`p-3.5 border-b border-gray-200 dark:border-gray-800/60 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-telegram-darkCard border-l-4 border-indigo-600 shadow-xs'
                        : 'hover:bg-gray-100 dark:hover:bg-telegram-darkHover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-medium">
                        {item.courseName || 'General'}
                      </span>
                      {mySubmission && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Submitted
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-telegram-darkMuted mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due: {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Assignment Detailed View */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-telegram-darkCard">
            {selectedAssignment ? (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedAssignment.title}
                    </h3>
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-xs font-semibold">
                      Due: {new Date(selectedAssignment.dueDate).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Assigned by: <span className="font-semibold">{selectedAssignment.teacherName}</span> • Course: {selectedAssignment.courseName}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 leading-relaxed whitespace-pre-wrap">
                    {selectedAssignment.description}
                  </p>
                </div>

                {/* STUDENT SECTION: Submit Homework */}
                {!isTeacherOrAdmin && (
                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-200 dark:border-gray-700 space-y-4">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-500" /> My Homework Submission
                    </h4>

                    {selectedAssignment.submissions?.find(s => s.studentId === (currentUser?.id || currentUser?._id)) ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
                          <span>Status: Submitted</span>
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs">
                            Grade: {selectedAssignment.submissions.find(s => s.studentId === (currentUser?.id || currentUser?._id)).grade}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {selectedAssignment.submissions.find(s => s.studentId === (currentUser?.id || currentUser?._id)).comment}
                        </p>
                        {selectedAssignment.submissions.find(s => s.studentId === (currentUser?.id || currentUser?._id)).feedback && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                            Teacher Feedback: "{selectedAssignment.submissions.find(s => s.studentId === (currentUser?.id || currentUser?._id)).feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleStudentSubmit} className="space-y-3">
                        <textarea
                          rows={3}
                          value={submissionComment}
                          onChange={(e) => setSubmissionComment(e.target.value)}
                          placeholder="Write comments or explanation for your homework..."
                          className="w-full p-3 bg-white dark:bg-telegram-darkCard border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        />
                        <div className="flex items-center justify-between">
                          <input
                            type="file"
                            onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                          >
                            {submitting ? 'Submitting...' : 'Submit Homework'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* TEACHER SECTION: View Student Submissions & Grade */}
                {isTeacherOrAdmin && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-500" /> Student Submissions ({selectedAssignment.submissions?.length || 0})
                    </h4>
                    {selectedAssignment.submissions?.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No student submissions received yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedAssignment.submissions.map((sub, idx) => (
                          <div key={idx} className="p-4 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-200 dark:border-gray-700 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={sub.studentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${sub.studentName}`}
                                  alt={sub.studentName}
                                  className="w-8 h-8 rounded-full"
                                />
                                <span className="font-bold text-sm text-gray-900 dark:text-white">{sub.studentName}</span>
                              </div>
                              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg">
                                Grade: {sub.grade}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                              {sub.comment || 'No text comments.'}
                            </p>

                            {sub.fileUrl && (
                              <a
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                              >
                                <FileText className="w-4 h-4" /> Attached File: {sub.fileName || 'View Document'}
                              </a>
                            )}

                            {/* Grade Editor */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60 flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Grade (e.g. A+)"
                                defaultValue={sub.grade}
                                onChange={(e) => setGradeInput(e.target.value)}
                                className="w-24 px-2 py-1 bg-white dark:bg-telegram-darkCard border border-gray-300 dark:border-gray-700 rounded-lg text-xs dark:text-white"
                              />
                              <input
                                type="text"
                                placeholder="Teacher feedback..."
                                defaultValue={sub.feedback}
                                onChange={(e) => setFeedbackInput(e.target.value)}
                                className="flex-1 px-2 py-1 bg-white dark:bg-telegram-darkCard border border-gray-300 dark:border-gray-700 rounded-lg text-xs dark:text-white"
                              />
                              <button
                                onClick={() => handleGradeSubmission(sub.studentId)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                Save Grade
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                Select an assignment from the left to view details.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-telegram-darkCard rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Math Quiz 3 / React Project"
                  className="w-full p-2.5 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-300 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Course Target</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-300 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                >
                  <option value="general">General Course</option>
                  {groups.filter(g => g.type === 'course').map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-300 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions for students..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-300 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md"
              >
                Publish Assignment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
