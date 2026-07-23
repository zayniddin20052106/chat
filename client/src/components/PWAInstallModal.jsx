import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2, Share } from 'lucide-react';

export default function PWAInstallModal({ onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Capture PWA Install Prompt event on Android/Chrome
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      alert('Ilovani o\'rnatish uchun brauzeringiz menyusidan "Add to Home Screen" / "Bosh ekranga qo\'shish" tugmasini bosing!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-full text-slate-400">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Smartphone className="w-9 h-9 text-white animate-bounce" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white">ConnectX Ilovasini Telefonga Yuklab Oling</h3>
            <p className="text-xs text-slate-400 mt-1">
              Telefoningizga ilovani o'rnatib, ilovadan chiqib ketganingizda ham uzluksiz xabarlar va bildirishnomalarni qabul qiling!
            </p>
          </div>
        </div>

        {/* Benefits List */}
        <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Foydalanuvchilar orasida 1-soniyalik tezkor xabarlar</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Orqa fonda ham bildirishnoma sound chalinishi</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>HD WebRTC video va ovozli qo'ng'iroqlar</span>
          </div>
        </div>

        {/* Action Button */}
        {isIOS ? (
          <div className="p-3 bg-blue-950/60 border border-blue-800/80 rounded-xl text-center text-xs text-blue-300">
            iPhone (iOS) uchun: Brauzerning <Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> <b>"Share"</b> tugmasini bosing va <b>"Add to Home Screen" (Bosh ekranga qo'shish)</b>-ni tanlang!
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-extrabold text-xs rounded-xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-white"
          >
            <Download className="w-4 h-4" />
            <span>Telefonga Ilovani O'rnatish / Yuklab Olish</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 text-slate-400 hover:text-white text-xs font-semibold"
        >
          Keyinroq / Brauzerda davom etish
        </button>
      </div>
    </div>
  );
}
