import React from 'react';
import type { GameStats } from '../types/game';
import { Volume2, VolumeX, LayoutGrid, Plus, RotateCcw } from 'lucide-react';

interface HeaderStatsProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenCategory: () => void;
  onOpenCustomWords: () => void;
  onResetRound: () => void;
  currentCategoryName: string;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onOpenCategory,
  onOpenCustomWords,
  onResetRound,
  currentCategoryName,
}) => {
  return (
    <header className="w-full max-w-xl mx-auto pt-2 pb-1 px-4 flex flex-col items-center">
      {/* Top Action Bar */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#232342] hover:bg-[#2f2f58] border border-[#393968] text-xs md:text-sm font-bold text-amber-400 shadow-md transition"
            title="تغيير التصنيف"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{currentCategoryName}</span>
          </button>

          <button
            onClick={onOpenCustomWords}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#232342] hover:bg-[#2f2f58] border border-[#393968] text-xs font-bold text-cyan-400 shadow-md transition"
            title="إضافة كلمة جديدة"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إضافة كلمة</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetRound}
            className="p-2 rounded-xl bg-[#232342] hover:bg-[#2f2f58] border border-[#393968] text-gray-300 hover:text-white transition shadow-md"
            title="إعادة كلمة جديدة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-[#232342] hover:bg-[#2f2f58] border border-[#393968] text-gray-300 hover:text-white transition shadow-md"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Title (Matching uploaded image style) */}
      <h1 className="text-2xl md:text-3xl font-black tracking-wide text-[#ff7828] neon-orange-text mb-2 text-center">
        لعبة المشنقة المصورة
      </h1>

      {/* Stats Ribbon (Matching uploaded image: Victories, Defeats, Streak, Record) */}
      <div className="w-full flex items-center justify-between text-xs md:text-sm font-bold bg-[#181830]/90 border border-[#2d2d54] py-2 px-3 rounded-2xl shadow-inner backdrop-blur-md">
        <div className="flex items-center gap-1 text-emerald-400">
          <span>✓</span>
          <span className="text-gray-300">الانتصارات :</span>
          <span className="text-white font-extrabold">{stats.victories}</span>
        </div>

        <div className="flex items-center gap-1 text-rose-400">
          <span>✗</span>
          <span className="text-gray-300">الهزائم :</span>
          <span className="text-white font-extrabold">{stats.defeats}</span>
        </div>

        <div className="flex items-center gap-1 text-amber-400">
          <span>🔥</span>
          <span className="text-gray-300">السلسلة :</span>
          <span className="text-white font-extrabold">{stats.streak}</span>
        </div>

        <div className="flex items-center gap-1 text-yellow-400">
          <span>🏆</span>
          <span className="text-gray-300">الرقم :</span>
          <span className="text-white font-extrabold">{stats.record}</span>
        </div>
      </div>
    </header>
  );
};
