import React, { useEffect } from 'react';
import type { WordItem } from '../types/game';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-pop select-none pointer-events-none">
      <div 
        dir="rtl"
        className={`px-10 py-5 sm:px-14 sm:py-6 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.5)] border-[3px] flex items-center justify-center transition-all duration-300 scale-110 ${
          isWon 
            ? 'bg-[#38A169] border-[#48BB78]/50 shadow-green-900/50' 
            : 'bg-[#E53E3E] border-[#F56565]/50 shadow-red-900/50'
        }`}
      >
        <h2 className="text-white text-5xl sm:text-6xl font-black drop-shadow-lg tracking-wide mb-0 flex items-center gap-3">
          {isWon ? (
            <>
              <span>أحسنت!</span>
              <span className="text-4xl sm:text-5xl">✔</span>
            </>
          ) : (
            <>
              <span>خطأ</span>
              <span className="text-4xl sm:text-5xl">✖</span>
            </>
          )}
        </h2>
      </div>
    </div>
  );
};
