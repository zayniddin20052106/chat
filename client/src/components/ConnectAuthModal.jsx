import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, User, Camera, Loader2, Mail, CheckCircle2, LogIn, UserPlus, Key } from 'lucide-react';
import axios from 'axios';
import { getFullMediaUrl, compressImageToBase64 } from '../apiConfig';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica'
];

export default function ConnectAuthModal({ onAuthSuccess, onLoginSuccess }) {
  const handleAuthComplete = onAuthSuccess || onLoginSuccess;

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Login State
  const [loginInput, setLoginInput] = useState('');

  // Register State
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

    try {
      // Compress device image into permanent lightweight Base64 string (~20KB)
      const base64Data = await compressImageToBase64(file, 300, 300);
      setCustomAvatar(base64Data);
    } catch (err) {
      console.log('Image compression error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Direct Account Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const cleanInput = loginInput.trim();
    if (!cleanInput) {
      setError('Iltimos, Email yoki User ID-ingizni kiriting');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/connect/auth/login', { emailOrUserId: cleanInput });
      const { token, user } = res.data;
      localStorage.setItem('connectx_token', token);
      localStorage.setItem('connectx_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      handleAuthComplete(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Kirishda xatolik yuz berdi. Emilingizni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration / Auto Login
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }

    const cleanEmail = email.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@connectx.com`;
    const finalAvatar = customAvatar.trim() || selectedAvatar;

    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/connect/auth/google', {
        fullName: cleanName,
        username: cleanName.toLowerCase().replace(/\s+/g, ''),
        email: cleanEmail,
        avatar: finalAvatar
      });
      const { token, user } = res.data;
      localStorage.setItem('connectx_token', token);
      localStorage.setItem('connectx_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      handleAuthComplete(user, token);
    } catch (err) {
      setError(err.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
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
        <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 text-center overflow-hidden border-b border-white/10">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mb-2 border border-white/25 shadow-xl shadow-blue-900/40">
              <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-md">ConnectX Platform</h2>
            <p className="text-blue-100 text-xs font-medium mt-1">
              {authMode === 'login' ? 'Mavjud akkauntingizga kirish' : 'Yangi akkaunt ro\'yxatdan o\'tkazish'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 border-b border-slate-700/60">
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(''); }}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Kirish (Login)</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setError(''); }}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Ro'yxatdan O'tish</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="p-6 space-y-4 bg-slate-900/95">
          {error && (
            <div className="p-3 text-xs text-red-400 bg-red-950/80 border border-red-800/80 rounded-2xl text-center font-medium animate-shake">
              {error}
            </div>
          )}

          {authMode === 'login' ? (
            /* Explicit Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Emailingiz yoki User ID-ingiz (`CX######`) *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="masalan: jahongir@gmail.com yoki CX102938"
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Akkauntga Kirilmoqda...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Akkauntimga Kirish</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  Hali akkauntingiz yo'qmi? Yangi akkaunt ro'yxatdan o'tkazish →
                </button>
              </div>
            </form>
          ) : (
            /* Explicit Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Profile Photo Selection */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-xl shadow-blue-500/20">
                    <img
                      src={customAvatar || selectedAvatar}
                      alt="Avatar Preview"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;
                      }}
                      className="w-full h-full rounded-full object-cover bg-slate-950 border-2 border-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg border-2 border-slate-900"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3 py-1 bg-slate-800 text-xs font-semibold rounded-xl text-blue-400 border border-slate-700 flex items-center gap-1"
                >
                  {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  <span>Rasm Tanlash</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ismingiz va Familiyangiz *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="masalan: Jahongir Boboev"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Emailingiz (Ixtiyoriy)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jahongir@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Ro'yxatdan O'tkazilmoqda...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Yangi Akkaunt Yaratish</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Secure Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>JWT Autentifikatsiya va Doimiy User ID (`CX######`)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
