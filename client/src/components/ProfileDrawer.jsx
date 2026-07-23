import React, { useState } from 'react';
import { 
  X, User, ShieldCheck, GraduationCap, UserCheck, 
  Edit3, Camera, Save, BookOpen, Key, Calendar 
} from 'lucide-react';
import axios from 'axios';

export default function ProfileDrawer({ currentUser, activeChat, onClose, onUpdateUser }) {
  const targetUser = activeChat || currentUser;
  const isSelf = !activeChat || activeChat.id === currentUser?.id || activeChat.id === currentUser?._id;

  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('educhat_token');
      const res = await axios.put('/api/auth/profile', { bio, avatar }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdateUser(res.data.user);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') return <ShieldCheck className="w-4 h-4 text-red-500" />;
    if (role === 'teacher') return <UserCheck className="w-4 h-4 text-emerald-500" />;
    return <GraduationCap className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-telegram-darkCard shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-fade-in select-none">
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-base text-gray-900 dark:text-white">
          {isSelf ? 'User Profile & Settings' : 'Chat Info'}
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-telegram-darkHover rounded-xl">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile Avatar Card */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <img
              src={editing ? avatar : (targetUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser?.username || targetUser?.name}`)}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-blue-500/20 mx-auto object-cover bg-slate-200 dark:bg-slate-800 shadow-md"
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-telegram-darkCard rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5 font-bold text-lg text-gray-900 dark:text-white">
              <span>{targetUser?.username || targetUser?.name}</span>
              {getRoleBadge(targetUser?.role)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 capitalize font-medium mt-0.5">
              {targetUser?.role || targetUser?.type || 'Student'}
            </p>
          </div>
        </div>

        {/* Self Profile Edit Options */}
        {isSelf && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Bio / Custom Status
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-300 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-telegram-darkSidebar border border-gray-300 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-md flex items-center justify-center gap-1"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2.5 bg-gray-100 dark:bg-telegram-darkSidebar hover:bg-gray-200 text-gray-800 dark:text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile & Status
              </button>
            )}
          </div>
        )}

        {/* Bio Details */}
        <div className="p-4 bg-gray-50 dark:bg-telegram-darkSidebar rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">About</div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {targetUser?.bio || targetUser?.description || 'No bio specified.'}
          </p>
        </div>

        {targetUser?.courseCode && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-1">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Course Invite Code</div>
            <div className="text-lg font-mono font-bold text-blue-700 dark:text-blue-300">
              {targetUser.courseCode}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
