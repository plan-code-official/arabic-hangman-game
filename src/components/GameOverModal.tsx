import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { WordItem } from '../types/game';
import { Trophy, Frown, ArrowRight } from 'lucide-react';

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
  onNextWord,
  isLastQuestion = false,
  onFinishSession,
}) => {
  const isWon = status === 'won';

  useEffect(() => {
    if (isWon) {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLastQuestion && onFinishSession) {
        onFinishSession();
      } else {
        onNextWord();
      }
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(timer);
  }, [isLastQuestion, onFinishSession, onNextWord]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-pop">
      <div className="relative w-full max-w-sm bg-[#181832] border-2 border-[#373764] rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${
            isWon
              ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 shadow-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/50 shadow-rose-500/30'
          }`}
        >
          {isWon ? (
            <Trophy className="w-10 h-10 animate-bounce-short" />
          ) : (
            <Frown className="w-10 h-10 animate-shake" />
          )}
        </div>

        <h2
          className={`text-5xl font-black ${
            isWon ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isWon ? 'أحسنت' : 'أخطأت'}
        </h2>
      </div>
    </div>
  );
};
