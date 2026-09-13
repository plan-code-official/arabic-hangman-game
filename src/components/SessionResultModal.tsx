import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Coins, Zap, Trophy, RotateCcw, CheckCircle2, Award } from 'lucide-react';
import type { SessionCompletionData } from '../services/gameApi';

interface SessionResultModalProps {
  data: SessionCompletionData;
  onRestart: () => void;
}

export const SessionResultModal: React.FC<SessionResultModalProps> = ({
  data,
  onRestart,
}) => {
  const { score, percentage, stars, coins, experience } = data;

  useEffect(() => {
    // Fire celebration confetti if player earned stars or passed
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e', '#818cf8'],
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-pop select-none font-arabic"
    >
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-gradient-to-b from-[#1a2035]/95 via-[#131728]/95 to-[#0b0e1b]/95 border-2 border-white/20 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center text-white overflow-hidden">
        {/* Glow ambient background aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy / Badge Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-[2px] shadow-[0_0_35px_rgba(245,158,11,0.45)]">
            <div className="w-full h-full rounded-3xl bg-slate-900/90 flex items-center justify-center">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 drop-shadow-md animate-bounce-short" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md mb-1">
          اكتملت الجلسة بنجاح!
        </h2>
        <p className="text-sm sm:text-base text-slate-300 font-medium mb-5">
          نتائج مستواك في تحدي تخمين الكلمات
        </p>

        {/* Stars Container (1 to 3 stars) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          {[1, 2, 3].map((starNum) => {
            const isEarned = starNum <= Math.max(0, stars);
            return (
              <div
                key={starNum}
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  isEarned ? 'scale-110' : 'scale-90 opacity-40'
                }`}
              >
                <Star
                  className={`w-10 h-10 sm:w-12 sm:h-12 ${
                    isEarned
                      ? 'fill-amber-400 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                      : 'fill-slate-700 text-slate-600'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Score & Percentage Bar */}
        <div className="w-full grid grid-cols-2 gap-3 mb-5">
          {/* Points */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold mb-1">
              <Award className="w-4 h-4" />
              <span>النقاط</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {score}
            </span>
          </div>

          {/* Percentage */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>نسبة النجاح</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Rewards Section: Coins & Experience */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* Coins */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-center justify-center gap-2">
            <Coins className="w-6 h-6 text-amber-400 drop-shadow-sm" />
            <div className="text-right">
              <span className="text-[11px] text-amber-200/80 block">العملات المكتسبة</span>
              <span className="text-lg font-black text-amber-300">+{coins}</span>
            </div>
          </div>

          {/* Experience */}
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-3 flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400 drop-shadow-sm" />
            <div className="text-right">
              <span className="text-[11px] text-cyan-200/80 block">الخبرة المكتسبة</span>
              <span className="text-lg font-black text-cyan-300">+{experience} XP</span>
            </div>
          </div>
        </div>

        {/* Action Button: Restart / Replay */}
        <button
          type="button"
          onClick={onRestart}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg shadow-[0_10px_25px_rgba(37,99,235,0.4)] transition active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>إعادة التحدي</span>
        </button>
      </div>
    </div>
  );
};
