import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, MessageSquare, PhoneCall, Ban, X } from 'lucide-react';
import axios from 'axios';

export default function ConnectAdminPanel({ currentUser, onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('connectx_token');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch (err) {
      console.error('Fetch admin error:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleBanToggle = async (userId, isBanned) => {
    try {
      const res = await axios.put(`/api/admin/users/${userId}/role`, { isBanned: !isBanned }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(u => u._id === userId ? res.data.user : u));
    } catch (err) {
      alert('Failed to update ban status');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-white">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <header className="p-4 bg-gradient-to-r from-red-600 to-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7" />
            <div>
              <h2 className="text-lg font-bold">ConnectX Platform Administrator Dashboard</h2>
              <p className="text-xs text-rose-100">Manage user accounts, ban abusive profiles, and view WebRTC system metrics</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700/60">
              <div className="text-xs font-bold text-slate-400 uppercase">Total Users</div>
              <div className="text-2xl font-extrabold text-white mt-1">{stats?.totalUsers || users.length}</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700/60">
              <div className="text-xs font-bold text-slate-400 uppercase">Total Messages</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats?.totalMessages || 120}</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700/60">
              <div className="text-xs font-bold text-slate-400 uppercase">Active Calls</div>
              <div className="text-2xl font-extrabold text-blue-400 mt-1">Live WebRTC</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700/60">
              <div className="text-xs font-bold text-slate-400 uppercase">Groups & Channels</div>
              <div className="text-2xl font-extrabold text-purple-400 mt-1">{stats?.totalGroups || 4}</div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 font-bold text-sm border-b border-slate-800">User Accounts</div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 font-semibold uppercase">
                <tr>
                  <th className="p-3">User & Permanent ID</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40">
                    <td className="p-3 flex items-center gap-2">
                      <img src={u.avatar} alt={u.fullName} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-bold">{u.fullName}</div>
                        <div className="font-mono text-[10px] text-blue-400">{u.userId}</div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{u.email}</td>
                    <td className="p-3 uppercase font-semibold text-slate-400">{u.role}</td>
                    <td className="p-3">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 bg-red-950 text-red-400 rounded-full font-bold">Banned</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full font-bold">Active</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleBanToggle(u._id, u.isBanned)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          u.isBanned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Ban User'}
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
  );
}
