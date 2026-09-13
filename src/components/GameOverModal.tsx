import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { WordItem } from '../types/game';
import { Trophy, Frown, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface GameOverModalProps {
  status: 'won' | 'lost';
  wordItem: WordItem;
  onNextWord: () => void;
  onRestart: () => void;
  streak: number;
  isLastQuestion?: boolean;
  onFinishSession?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  wordItem,
  onNextWord,
  onRestart,
  streak,
  isLastQuestion = false,
  onFinishSession,
}) => {
  const isWon = status === 'won';

  useEffect(() => {
    if (isWon) {
      // Fire confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff7828', '#f59e0b', '#10b981', '#38bdf8', '#a855f7'],
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isWon]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-pop">
      <div className="relative w-full max-w-sm bg-[#181832] border-2 border-[#373764] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Glow Header Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
            isWon
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-rose-500/30'
          }`}
        >
          {isWon ? (
            <Trophy className="w-9 h-9 animate-bounce-short" />
          ) : (
            <Frown className="w-9 h-9 animate-shake" />
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl font-black mb-1 ${
            isWon ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isWon ? 'أحسنت! إجابة صحيحة 🎉' : 'للأسف! انتهت المحاولات 💔'}
        </h2>

        {/* Streak banner on win */}
        {isWon && streak > 1 && (
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>سلسلة انتصارات متتالية: {streak} 🔥</span>
          </div>
        )}

        {/* Word Clue Review */}
        <div className="w-full bg-[#121226] border border-[#2c2c50] rounded-2xl p-3 my-3 flex items-center gap-3">
          <img
            src={wordItem.imageUrl}
            alt={wordItem.word}
            className="w-16 h-16 rounded-xl object-cover border border-[#3c3c66]"
          />
          <div className="text-right flex-1">
            <span className="text-xs text-gray-400 block mb-0.5">
              الكلمة الصحيحة هي:
            </span>
            <span className="text-xl font-black text-amber-300 neon-gold-text">
              {wordItem.word}
            </span>
            {wordItem.hint && (
              <span className="text-[11px] text-gray-400 block mt-0.5 truncate">
                💡 {wordItem.hint}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={isLastQuestion ? onFinishSession : onNextWord}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff7828] to-[#f59e0b] hover:from-[#ff8838] hover:to-[#fbb028] text-white font-black text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>{isLastQuestion ? 'عرض النتيجة النهائية 🏆' : 'السؤال التالي'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isLastQuestion && (
            <button
              type="button"
              onClick={onRestart}
              className="p-3 rounded-xl bg-[#252548] hover:bg-[#32325c] border border-[#3b3b68] text-gray-300 hover:text-white transition cursor-pointer"
              title="إعادة نفس الكلمة"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
