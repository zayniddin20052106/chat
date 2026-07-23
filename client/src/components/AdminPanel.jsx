import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, MessageSquare, BookOpen, FileCheck, 
  UserCheck, GraduationCap, Ban, CheckCircle, X 
} from 'lucide-react';
import axios from 'axios';

export default function AdminPanel({ currentUser, onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('educhat_token');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(u => u._id === userId ? res.data.user : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleBanToggle = async (userId, currentBanned) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/role`, { isBanned: !currentBanned }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(u => u._id === userId ? res.data.user : u));
    } catch (err) {
      alert('Failed to update user ban status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl h-[85vh] bg-white dark:bg-telegram-darkCard rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="p-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">EduChat Administrator Dashboard</h2>
              <p className="text-xs text-rose-100">Platform moderation, user management, and activity metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                <span className="text-xs font-semibold uppercase">Total Users</span>
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats?.totalUsers || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                <span className="text-xs font-semibold uppercase">Total Messages</span>
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats?.totalMessages || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                <span className="text-xs font-semibold uppercase">Courses & Groups</span>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats?.totalGroups || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                <span className="text-xs font-semibold uppercase">Assignments</span>
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats?.totalAssignments || 0}
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-900 dark:text-white">
              User Accounts Management ({users.length})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-telegram-darkCard text-gray-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white dark:hover:bg-telegram-darkCard transition-colors">
                      <td className="p-3 flex items-center gap-2.5">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt={u.username}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{u.username}</div>
                          <div className="text-[10px] text-gray-400">{u.bio}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="p-1.5 bg-white dark:bg-telegram-darkCard border border-gray-300 dark:border-gray-700 rounded-lg text-xs dark:text-white font-medium"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        {u.isBanned ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">Suspended</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-semibold">Active</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleBanToggle(u._id, u.isBanned)}
                          className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                            u.isBanned
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {u.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
