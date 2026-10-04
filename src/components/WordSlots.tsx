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
  const charCount = letters.filter(c => c !== ' ').length;

  // Responsive slot sizing based on word length to prevent awkward line breaks
  const getSlotSizeClass = () => {
    if (charCount <= 4) {
      return {
        box: 'w-[clamp(2.6rem,7.5vw,4.25rem)] h-[clamp(3.1rem,8vh,5.2rem)]',
        font: 'text-[clamp(2rem,6.5vw,3.4rem)]',
        gap: 'gap-1.5 sm:gap-2.5 md:gap-3',
      };
    }
    if (charCount <= 6) {
      return {
        box: 'w-[clamp(2.2rem,5.8vw,3.5rem)] h-[clamp(2.7rem,7vh,4.5rem)]',
        font: 'text-[clamp(1.7rem,5vw,2.8rem)]',
        gap: 'gap-1 sm:gap-2',
      };
    }
    return {
      box: 'w-[clamp(1.85rem,4.6vw,2.9rem)] h-[clamp(2.35rem,6vh,3.8rem)]',
      font: 'text-[clamp(1.4rem,4vw,2.3rem)]',
      gap: 'gap-1 sm:gap-1.5',
    };
  };

  const { box, font, gap } = getSlotSizeClass();

  return (
    <div className="w-full flex items-center justify-center text-center my-0.5 sm:my-1.5 mx-auto max-w-full overflow-hidden">
      {/* Letter Boxes Container (Centered RTL) */}
      <div
        dir="rtl"
        className={`flex items-center justify-center flex-wrap ${gap} mx-auto max-w-full`}
      >
        {letters.map((char, index) => {
          if (char === ' ') {
            return <div key={index} className="w-2 sm:w-3" />;
          }

          const isGuessed = Array.from(guessedLetters).some((guessed) =>
            isArabicCharMatch(guessed, char)
          );
          const showLetter = isGuessed || revealAll;

          return (
            <div
              key={index}
              className={`${box} rounded-lg sm:rounded-xl bg-[#2563eb] border-2 border-white/50 shadow-lg shadow-blue-600/40 flex items-center justify-center text-center transition-all duration-300 ${
                showLetter ? 'animate-pop' : ''
              }`}
            >
              {showLetter ? (
                <span
                  className={`${font} font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none flex items-center justify-center ${
                    !isGuessed && revealAll ? 'text-rose-200' : ''
                  }`}
                >
                  {char}
                </span>
              ) : (
                <span className={`invisible ${font} font-black leading-none`}>
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

