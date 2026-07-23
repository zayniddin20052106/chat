import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2, Share, PlusSquare, ArrowDown } from 'lucide-react';

export default function PWAInstallModal({ onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

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
      alert('Brauzeringiz menyusidan "Add to Home Screen" / "Bosh ekranga qo\'shish" opsiyasini tanlang!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in text-white overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden my-auto">
        
        {/* Ambient Blur Glows */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-full text-slate-400 z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Smartphone className="w-8 h-8 text-white animate-bounce" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/80 border border-blue-700/60 rounded-full text-[11px] font-bold text-blue-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isIOS ? '📱 iPhone (iOS) Aniqlandi' : isAndroid ? '🤖 Android Qo\'llab-quvvatlanadi' : '📱 Mobil Ilova Rejimi'}</span>
            </div>

            <h3 className="text-xl font-black text-white">ConnectX Ilovasini Telefonga O'rnatish</h3>
            <p className="text-xs text-slate-400 mt-1">
              ConnectX'ni telefoningiz ishchi stoliga ilova sifatida o'rnating va orqa fonda ham bildirishnomalarni oling!
            </p>
          </div>
        </div>

        {/* iPhone (iOS) Special Step-by-Step Instructions */}
        {isIOS ? (
          <div className="p-4 bg-slate-800/90 rounded-2xl border border-blue-500/40 space-y-3 text-xs">
            <div className="font-extrabold text-blue-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>iPhone-ga 3 ta Oson Qadamda O'rnatish:</span>
            </div>

            <div className="space-y-2.5 text-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5">1</span>
                <div>
                  Safari brauzerining pastki panelidagi <Share className="w-4 h-4 inline mx-1 text-blue-400 animate-pulse" /> <b>"Ulashish" (Share)</b> tugmasini bosing.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5">2</span>
                <div>
                  Paydo bo'lgan menyudan <PlusSquare className="w-4 h-4 inline mx-1 text-emerald-400" /> <b>"Bosh ekranga qo'shish" (Add to Home Screen)</b> opsiyasini tanlang.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5">3</span>
                <div>
                  Tepa o'ng burchakdagi <b>"Qo'shish" (Add)</b> tugmasini bosing. Ilova iPhone ekraningizda tayyor bo'ladi!
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome Native Install Button */
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1-soniyalik tezkor xabarlar va WebRTC qo'ng'iroqlar</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ilovadan chiqib ketilganda ham `message.mp3` sound chalinishi</span>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-black text-xs rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-white tracking-wide"
            >
              <Download className="w-5 h-5" />
              <span>ILOVANI TELEFONGA O'RNATISH (INSTALL APP)</span>
            </button>
          </div>
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
