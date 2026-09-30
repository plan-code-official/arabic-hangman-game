import React from 'react';
import { isArabicCharMatch } from '../utils/arabicUtils';

interface WordSlotsProps {
  targetWord: string;
  guessedLetters: Set<string>;
  revealAll?: boolean;
}

export const WordSlots: React.FC<WordSlotsProps> = ({
  targetWord,
  guessedLetters,
  revealAll = false,
}) => {
  const letters = targetWord.split('');

  return (
    <div className="w-full flex items-center justify-center text-center my-1 sm:my-2 mx-auto">
      {/* Letter Boxes Container (Centered RTL) */}
      <div
        dir="rtl"
        className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2.5 md:gap-3 mx-auto"
      >
        {letters.map((char, index) => {
          if (char === ' ') {
            return <div key={index} className="w-2.5 sm:w-4" />;
          }

          const isGuessed = Array.from(guessedLetters).some((guessed) =>
            isArabicCharMatch(guessed, char)
          );
          const showLetter = isGuessed || revealAll;

          return (
            <div
              key={index}
              className={`w-[clamp(2.5rem,7vw,4rem)] h-[clamp(3.1rem,9vw,5.2rem)] rounded-lg sm:rounded-xl bg-[#2563eb] border-2 border-white/50 shadow-lg shadow-blue-600/40 flex items-center justify-center text-center transition-all duration-300 ${
                showLetter ? 'animate-pop' : ''
              }`}
            >
              {showLetter ? (
                <span
                  className={`text-[clamp(1.85rem,6.5vw,3.2rem)] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none flex items-center justify-center ${
                    !isGuessed && revealAll ? 'text-rose-200' : ''
                  }`}
                >
                  {char}
                </span>
              ) : (
                <span className="invisible text-[clamp(1.85rem,6.5vw,3.2rem)] font-black leading-none">
                  {char}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
