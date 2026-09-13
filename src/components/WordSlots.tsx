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
    <div className="w-full flex items-center justify-center text-center my-1.5 mx-auto">
      {/* Letter Boxes Container (Centered RTL) */}
      <div
        dir="rtl"
        className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5 md:gap-3 mx-auto"
      >
        {letters.map((char, index) => {
          if (char === ' ') {
            return <div key={index} className="w-3 sm:w-4" />;
          }

          const isGuessed = Array.from(guessedLetters).some((guessed) =>
            isArabicCharMatch(guessed, char)
          );
          const showLetter = isGuessed || revealAll;

          return (
            <div
              key={index}
              className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-[#2563eb] border-2 border-white/40 shadow-md shadow-blue-600/30 flex items-center justify-center text-center transition-all duration-300 ${
                showLetter ? 'animate-pop' : ''
              }`}
            >
              {showLetter ? (
                <span
                  className={`text-xl sm:text-2xl md:text-3xl font-black text-white ${
                    !isGuessed && revealAll ? 'text-rose-200' : ''
                  }`}
                >
                  {char}
                </span>
              ) : (
                <span className="invisible text-xl sm:text-2xl md:text-3xl font-black">
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
