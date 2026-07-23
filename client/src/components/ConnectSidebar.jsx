import React, { useState } from 'react';
import { 
  Search, MessageSquare, Users, Megaphone, PhoneCall, 
  ShieldCheck, Sun, Moon, LogOut, Plus, UserPlus, CheckCheck, Sparkles 
} from 'lucide-react';
import axios from 'axios';
import { getFullMediaUrl } from '../apiConfig';

export default function ConnectSidebar({
  currentUser,
  users,
  groups,
  activeChat,
  setActiveChat,
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenNewChatModal,
  onOpenAdminPanel,
  onOpenProfileModal,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const token = localStorage.getItem('connectx_token');
      const res = await axios.get(`/api/connect/search?q=${encodeURIComponent(val)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.userId && u.userId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800/80 shrink-0 transition-colors duration-200 select-none">
      
      {/* Header Profile Info Bar */}
      <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <div 
          onClick={onOpenProfileModal}
          className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-gray-200/50 dark:hover:bg-slate-800 transition-all"
        >
          <div className="relative">
            <img
              src={getFullMediaUrl(currentUser?.avatar, currentUser?.username || 'me')}
              alt={currentUser?.fullName}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 object-cover bg-blue-100 dark:bg-slate-800"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900 dark:text-white truncate">
              <span>{currentUser?.fullName}</span>
              {currentUser?.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="font-mono px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold rounded">
                {currentUser?.userId || 'CX000000'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdminPanel}
              title="Admin Panel"
              className="p-2 rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-all"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
            className="p-2 rounded-xl text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 transition-all"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-600" />}
          </button>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Instant Search Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by CX User ID, Username, Name..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="px-3 pb-2 flex items-center gap-1 border-b border-gray-100 dark:border-slate-800/80">
        {[
          { id: 'chats', label: 'Chats', icon: MessageSquare },
          { id: 'friends', label: 'Friends', icon: Users },
          { id: 'channels', label: 'Channels', icon: Megaphone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat / Users Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/40">
        {searchQuery.trim() !== '' && searchResults.length > 0 ? (
          <div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50/50 dark:bg-blue-950/20">
              Search Results ({searchResults.length})
            </div>
            {searchResults.map((u) => (
              <div
                key={u._id}
                onClick={() => {
                  setActiveChat({ id: u._id, name: u.fullName, username: u.username, type: 'private', avatar: getFullMediaUrl(u.avatar, u.username), userId: u.userId, bio: u.bio });
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <img src={getFullMediaUrl(u.avatar, u.username)} alt={u.fullName} className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{u.fullName}</span>
                    <span className="font-mono text-[10px] text-blue-500 font-bold">{u.userId}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">@{u.username} • {u.bio}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Render Groups & Channels */}
            {filteredGroups.map((group) => {
              const isSelected = activeChat?.id === group._id;
              const groupAvatar = getFullMediaUrl(group.avatar, group.name);
              return (
                <div
                  key={group._id}
                  onClick={() => setActiveChat({ id: group._id, name: group.name, type: group.type, avatar: groupAvatar, description: group.description, inviteCode: group.inviteCode })}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <img src={groupAvatar} alt={group.name} className="w-11 h-11 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{group.name}</h4>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">{group.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{group.description || `Code: ${group.inviteCode}`}</p>
                  </div>
                </div>
              );
            })}

            {/* Render Direct Users */}
            {filteredUsers.map((user) => {
              const isSelected = activeChat?.id === user._id && activeChat?.type === 'private';
              const userAvatar = getFullMediaUrl(user.avatar, user.username);
              return (
                <div
                  key={user._id}
                  onClick={() => setActiveChat({ id: user._id, name: user.fullName, username: user.username, type: 'private', avatar: userAvatar, userId: user.userId, bio: user.bio })}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative">
                    <img src={userAvatar} alt={user.fullName} className="w-11 h-11 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.fullName}</h4>
                      <span className="font-mono text-[10px] text-blue-400 font-bold">{user.userId}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{user.bio || `@${user.username}`}</p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={onOpenNewChatModal}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Group or Channel</span>
        </button>
      </div>
    </aside>
  );
}
