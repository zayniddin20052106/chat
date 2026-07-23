import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Shield, Search, Sparkles, UserCheck, MessageSquare } from 'lucide-react';
import axios from 'axios';

export default function FriendsManager({ currentUser, onStartDirectChat, onClose }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [mobileTab, setMobileTab] = useState('search'); // 'search' or 'friends'

  const token = localStorage.getItem('connectx_token');

  const fetchFriendsData = async () => {
    try {
      const res = await axios.get('/api/connect/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(res.data.friends || []);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Fetch friends error:', err);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`/api/connect/search?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleSendRequest = async (targetUserId) => {
    try {
      await axios.post('/api/connect/friends/request', { targetUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Friend request sent successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post('/api/connect/friends/accept', { requestId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFriendsData();
      alert('Friend request accepted!');
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl h-[90vh] md:h-[80vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <header className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">ConnectX Friends Hub</h2>
              <p className="text-[11px] sm:text-xs text-blue-100">Find connections by CX User ID or manage requests</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl"><X className="w-5 h-5" /></button>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden border-b border-slate-800 bg-slate-950/40 p-1">
          <button
            onClick={() => setMobileTab('search')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mobileTab === 'search' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            Find Friends (Qidirish)
          </button>
          <button
            onClick={() => setMobileTab('friends')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all relative ${
              mobileTab === 'friends' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            My Friends ({friends.length})
            {requests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full animate-pulse">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Search Section */}
          <div className={`${mobileTab === 'search' ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-slate-800 flex-col space-y-3 overflow-y-auto`}>
            <div className="relative shrink-0">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by ID (CX102938), username..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Search Results</div>
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  {searchQuery ? 'No users found.' : 'Type a CX User ID or Name to find friends.'}
                </div>
              ) : (
                searchResults.map((u) => (
                  <div key={u._id} className="p-3 bg-slate-800/70 hover:bg-slate-800 rounded-2xl flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={u.avatar} alt={u.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{u.fullName}</div>
                        <div className="text-[10px] text-blue-400 font-mono font-bold">{u.userId}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendRequest(u._id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Friends & Pending Requests Section */}
          <div className={`${mobileTab === 'friends' ? 'flex' : 'hidden md:flex'} w-full md:w-1/2 p-4 flex-col space-y-5 overflow-y-auto`}>
            
            {/* Pending Requests */}
            {requests.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pending Requests ({requests.length})</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                </div>
                <div className="space-y-2">
                  {requests.map((r) => (
                    <div key={r._id} className="p-3 bg-slate-800/90 rounded-2xl flex items-center justify-between border border-amber-500/30 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={r.senderAvatar} alt={r.senderName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{r.senderName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.senderUserId}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcceptRequest(r._id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Friends List */}
            <div className="space-y-2 flex-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Friends ({friends.length})</div>
              {friends.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-2xl">
                  You have no friends added yet. Use the search to add people!
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((f) => (
                    <div key={f._id} className="p-3 bg-slate-800/80 hover:bg-slate-800 rounded-2xl flex items-center justify-between border border-slate-800">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={f.avatar} alt={f.fullName} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{f.fullName}</div>
                          <div className="text-[10px] text-blue-400 font-mono font-bold">{f.userId}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onStartDirectChat({ id: f._id, name: f.fullName, username: f.username, type: 'private', avatar: f.avatar, userId: f.userId, bio: f.bio });
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shrink-0 flex items-center gap-1 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
