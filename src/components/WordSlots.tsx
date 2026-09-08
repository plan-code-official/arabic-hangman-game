import React from 'react';
import { isArabicCharMatch } from '../utils/arabicUtils';

interface WordSlotsProps {
  targetWord: string;
  guessedLetters: Set<string>;
  revealAll?: boolean;
  remainingAttempts: number;
}

export const WordSlots: React.FC<WordSlotsProps> = ({
  targetWord,
  guessedLetters,
  revealAll = false,
  remainingAttempts,
}) => {
  const letters = targetWord.split('');

  return (
    <div className="w-full flex flex-col items-center justify-center my-3 px-2">
      {/* Letter Boxes Container (RTL) */}
      <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3.5 my-2">
        {letters.map((char, index) => {
          if (char === ' ') {
            return <div key={index} className="w-4 md:w-6" />;
          }

          const isGuessed = Array.from(guessedLetters).some((guessed) =>
            isArabicCharMatch(guessed, char)
          );
          const showLetter = isGuessed || revealAll;

          return (
            <div
              key={index}
              className="flex flex-col items-center justify-end group"
            >
              {/* The Letter */}
              <div className="h-10 md:h-12 flex items-center justify-center min-w-[28px] md:min-w-[36px]">
                {showLetter ? (
                  <span
                    className={`text-2xl md:text-3xl font-black text-amber-300 neon-gold-text ${
                      isGuessed ? 'animate-pop' : 'text-rose-400'
                    }`}
                  >
                    {char}
                  </span>
                ) : (
                  <span className="invisible text-2xl md:text-3xl font-black">
                    {char}
                  </span>
                )}
              </div>

              {/* Underline Bar (Matching uploaded screenshot) */}
              <div
                className={`w-7 md:w-9 h-1 rounded-full transition-all duration-300 ${
                  showLetter
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                    : 'bg-[#43436d]'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Remaining Attempts Label (Matching uploaded screenshot: Tentatives restantes : 1) */}
      <div className="mt-2 text-xs md:text-sm font-bold text-gray-400 flex items-center gap-1.5">
        <span>المحاولات المتبقية :</span>
        <span
          className={`font-black text-base px-2 py-0.5 rounded-lg ${
            remainingAttempts <= 2
              ? 'text-rose-400 bg-rose-950/60 border border-rose-800 animate-pulse'
              : 'text-amber-300 bg-[#222240]'
          }`}
        >
          {remainingAttempts}
        </span>
      </div>
    </div>
  );
};
