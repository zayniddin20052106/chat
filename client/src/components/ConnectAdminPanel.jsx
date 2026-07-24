import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, MessageSquare, Megaphone, Send, Ban, X, Loader2, Radio } from 'lucide-react';
import axios from 'axios';

export default function ConnectAdminPanel({ currentUser, onClose }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const token = localStorage.getItem('connectx_token');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
        axios.get('/api/admin/users', { headers: { Authorization: token ? `Bearer ${token}` : '' } })
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
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setUsers(users.map(u => (u._id === userId || u.id === userId) ? res.data.user : u));
    } catch (err) {
      alert('Failed to update ban status');
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementText.trim()) return;

    setSendingBroadcast(true);
    setBroadcastSuccess(false);
    try {
      await axios.post('/api/admin/broadcast', { text: announcementText.trim() }, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      setAnnouncementText('');
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Broadcast failed');
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-5xl h-[88dvh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto">
        
        {/* Header */}
        <header className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-purple-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">ConnectX Platform Administrator Dashboard</h2>
              <p className="text-xs text-rose-100 font-medium">Real-time user monitoring & Official Channel Broadcast Control</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Real-time Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase">Total Users</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">{stats?.totalUsers || users.length}</div>
            </div>

            <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/60 shadow-md">
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <span className="text-xs font-bold uppercase">Online Now</span>
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{stats?.onlineUsers || 1}</div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase">Total Messages</span>
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">{stats?.totalMessages || 0}</div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase">Groups & Channels</span>
                <Megaphone className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{stats?.totalGroups || 0}</div>
            </div>
          </div>

          {/* Official Channel Broadcast Post Box */}
          <div className="p-5 bg-gradient-to-br from-blue-950/60 via-slate-800/90 to-indigo-950/60 border border-blue-800/60 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-blue-300">
              <Megaphone className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>📢 ConnectX Official Announcements (Ommaviy Yangiliklar Kanaliga Xabar Yuborish)</span>
            </div>
            <p className="text-xs text-slate-400">
              Ushbu bo'limdan yuborilgan e'lonlar avtomatik tarzda Telegram News kabi <b>ConnectX Official Announcements</b> ommaviy kanaliga tushadi va barcha foydalanuvchilarga yetib boradi.
            </p>

            {broadcastSuccess && (
              <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-xs text-emerald-400 font-bold">
                ✓ E'lon muvaffaqiyatli barcha foydalanuvchilarga uzatildi!
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <textarea
                rows={3}
                required
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="E'lon va yangilik matnini kiriting (masalan: ConnectX v2.0 yangilanishi e'lon qilindi!)..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />

              <button
                type="submit"
                disabled={sendingBroadcast || !announcementText.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {sendingBroadcast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Hammaga E'lon Yuborish (Post Broadcast)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 font-bold text-sm border-b border-slate-800 flex items-center justify-between">
              <span>User Accounts Management</span>
              <span className="text-xs text-slate-400 font-mono font-normal">Click Ban/Unban to restrict access</span>
            </div>
            <div className="overflow-x-auto">
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
                    <tr key={u._id || u.id} className="hover:bg-slate-800/40">
                      <td className="p-3 flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.fullName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div>
                          <div className="font-bold text-white">{u.fullName}</div>
                          <div className="font-mono text-[10px] text-blue-400 font-bold">{u.userId}</div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{u.email}</td>
                      <td className="p-3 uppercase font-semibold text-slate-400">{u.role || 'user'}</td>
                      <td className="p-3">
                        {u.isBanned ? (
                          <span className="px-2.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded-full font-bold">Banned</span>
                        ) : u.status === 'online' ? (
                          <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold">Online</span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full font-bold">Offline</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleBanToggle(u._id || u.id, u.isBanned)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                            u.isBanned ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
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
    </div>
  );
}
