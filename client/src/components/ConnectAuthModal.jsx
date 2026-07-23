import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, User, Camera, Loader2, Mail, CheckCircle2, Lock } from 'lucide-react';
import axios from 'axios';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica'
];

export default function ConnectAuthModal({ onLoginSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  const avatarInputRef = useRef(null);

  const handleDeviceImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    // Server upload for persistence
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.fileUrl) {
        setCustomAvatar(res.data.fileUrl);
      }
    } catch (err) {
      console.log('Server upload fallback to local base64:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRegisterOrLogin = async (userData) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/connect/auth/google', userData);
      const { token, user } = res.data;
      localStorage.setItem('connectx_token', token);
      localStorage.setItem('connectx_user', JSON.stringify(user));
      onLoginSuccess(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCustom = (e) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }

    const cleanEmail = email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@connectx.com`;
    const finalAvatar = customAvatar.trim() || selectedAvatar;

    handleRegisterOrLogin({
      fullName: cleanName,
      username: cleanName.toLowerCase().replace(/\s+/g, ''),
      email: cleanEmail,
      avatar: finalAvatar
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Background Animated Blurred Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/70 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden text-white relative z-10 my-auto">
        
        {/* Hidden Device Image File Input */}
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          onChange={handleDeviceImageUpload}
          className="hidden"
        />

        {/* Premium Header Banner */}
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-7 text-center overflow-hidden border-b border-white/10">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/25 shadow-xl shadow-blue-900/40">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">ConnectX</h2>
            <p className="text-blue-100 text-xs font-medium mt-1 max-w-xs">
              Telegram & WhatsApp darajasidagi zamonaviy real-vaqt muloqot va WebRTC qo'ng'iroqlar platformasi
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-7 space-y-5 bg-slate-900/95">
          {error && (
            <div className="p-3 text-xs text-red-400 bg-red-950/80 border border-red-800/80 rounded-2xl text-center font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Profile Photo Selection Centerpiece */}
          <div className="flex flex-col items-center justify-center space-y-3 pb-1">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-xl shadow-blue-500/20">
                <img
                  src={customAvatar || selectedAvatar}
                  alt="Avatar Preview"
                  className="w-full h-full rounded-full object-cover bg-slate-950 border-2 border-slate-900"
                />
              </div>

              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                <Camera className="w-6 h-6 text-white mb-0.5" />
                <span className="text-[10px] font-bold text-blue-200">O'zgartirish</span>
              </div>

              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition-transform group-hover:scale-110"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Button Trigger */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingImage}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-xs font-semibold rounded-xl text-blue-400 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rasm yuklanmoqda...
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" /> Galereyangizdan Rasm Tanlang
                </>
              )}
            </button>

            {/* Avatar Presets Selection Carousel */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 max-w-full">
              {AVATAR_PRESETS.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt="preset avatar"
                  onClick={() => { setSelectedAvatar(url); setCustomAvatar(''); }}
                  className={`w-9 h-9 rounded-full cursor-pointer border-2 transition-all shrink-0 bg-slate-800 ${
                    selectedAvatar === url && !customAvatar ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/30' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Inputs */}
          <form onSubmit={handleSubmitCustom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ismingiz va Familiyangiz (Full Name) *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="masalan: Jahongir Boboev"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email / Username (Ixtiyoriy)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jahongir@connectx.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* High Impact Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Profil Yaratilmoqda...
                </>
              ) : (
                <>
                  <span>Kirish va Profilni Boshlash</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Secure Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Havfsiz JWT Autentifikatsiya va Noyob User ID (`CX######`)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
