import React, { useState } from 'react';
import { 
  Search, MessageSquare, Users, BookOpen, Megaphone, 
  Plus, Sun, Moon, ShieldCheck, GraduationCap, UserCheck, 
  BookMarked, Settings, LogOut, CheckCheck
} from 'lucide-react';

export default function Sidebar({
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
  onOpenHomeworkHub,
  onOpenAdminPanel,
  onOpenProfileDrawer,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filterChats = () => {
    let resultUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
    let resultGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'direct') {
      resultGroups = [];
    } else if (activeTab === 'courses') {
      resultUsers = [];
      resultGroups = resultGroups.filter(g => g.type === 'course');
    } else if (activeTab === 'channels') {
      resultUsers = [];
      resultGroups = resultGroups.filter(g => g.type === 'channel');
    } else if (activeTab === 'groups') {
      resultUsers = [];
      resultGroups = resultGroups.filter(g => g.type === 'group');
    }

    return { filteredUsers: resultUsers, filteredGroups: resultGroups };
  };

  const { filteredUsers, filteredGroups } = filterChats();

  const getRoleBadge = (role) => {
    if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" title="Admin" />;
    if (role === 'teacher') return <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Teacher" />;
    return <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" title="Student" />;
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-white dark:bg-telegram-darkSidebar border-r border-gray-200 dark:border-gray-800 shrink-0 transition-colors duration-200 select-none">
      {/* User Header Profile Bar */}
      <div className="p-3.5 bg-gray-50/80 dark:bg-telegram-darkCard/70 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div 
          onClick={onOpenProfileDrawer}
          className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-gray-200/50 dark:hover:bg-telegram-darkHover transition-all"
        >
          <div className="relative">
            <img
              src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.username}`}
              alt={currentUser?.username}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover bg-blue-100 dark:bg-slate-800"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-telegram-darkCard rounded-full"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-white truncate">
              <span>{currentUser?.username}</span>
              {getRoleBadge(currentUser?.role)}
            </div>
            <p className="text-xs text-gray-500 dark:text-telegram-darkMuted capitalize truncate">
              {currentUser?.role || 'Student'} • Online
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdminPanel}
              title="Admin Panel"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-telegram-darkHover transition-all"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, courses, channels..."
            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-telegram-darkCard border border-transparent dark:border-gray-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-3 pb-2 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800">
        {[
          { id: 'all', label: 'All', icon: MessageSquare },
          { id: 'direct', label: 'Direct', icon: Users },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'channels', label: 'Channels', icon: Megaphone }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-telegram-darkMuted hover:bg-gray-100 dark:hover:bg-telegram-darkHover'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Education Hub Banner Trigger */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800/60">
        <button
          onClick={onOpenHomeworkHub}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-blue-500/20 border border-indigo-200/50 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:scale-[1.01] transition-transform"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm">
              <BookMarked className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold uppercase tracking-wider">Homework Hub</div>
              <div className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80">
                {currentUser?.role === 'teacher' ? 'Assign & Grade Homework' : 'Submit & Track Assignments'}
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-md bg-indigo-600 text-white font-semibold shadow-xs">
            Open
          </span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800/40">
        {/* Render Groups & Channels */}
        {filteredGroups.map((group) => {
          const isSelected = activeChat?.id === group._id && activeChat?.type === group.type;
          return (
            <div
              key={group._id}
              onClick={() => setActiveChat({ id: group._id, name: group.name, type: group.type, avatar: group.avatar, description: group.description, courseCode: group.courseCode })}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-telegram-darkCard border-l-4 border-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-telegram-darkHover'
              }`}
            >
              <div className="relative">
                <img
                  src={group.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`}
                  alt={group.name}
                  className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-slate-200 dark:bg-slate-800"
                />
                {group.type === 'course' && (
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full">
                    <BookOpen className="w-3 h-3" />
                  </span>
                )}
                {group.type === 'channel' && (
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-purple-500 text-white rounded-full">
                    <Megaphone className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {group.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">
                    {group.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-telegram-darkMuted truncate">
                  {group.description || `Code: ${group.courseCode || 'N/A'}`}
                </p>
              </div>
            </div>
          );
        })}

        {/* Render Direct Users */}
        {filteredUsers.map((user) => {
          const isSelected = activeChat?.id === user._id && activeChat?.type === 'private';
          return (
            <div
              key={user._id}
              onClick={() => setActiveChat({ id: user._id, name: user.username, type: 'private', avatar: user.avatar, bio: user.bio, role: user.role })}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-telegram-darkCard border-l-4 border-blue-500'
                  : 'hover:bg-gray-50 dark:hover:bg-telegram-darkHover'
              }`}
            >
              <div className="relative">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 bg-slate-200 dark:bg-slate-800"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-telegram-darkSidebar rounded-full ${
                  user.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                }`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-white truncate">
                    <span>{user.username}</span>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-telegram-darkMuted truncate">
                  {user.bio || 'Available on EduChat'}
                </p>
              </div>
            </div>
          );
        })}

        {filteredGroups.length === 0 && filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-xs">
            No chats found matching search.
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onOpenNewChatModal}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Group / Course / Channel</span>
        </button>
      </div>
    </aside>
  );
}
