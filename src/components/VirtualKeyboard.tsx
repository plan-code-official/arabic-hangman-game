import React from 'react';
import { ARABIC_ALPHABET_ROWS, isArabicCharMatch } from '../utils/arabicUtils';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  guessedLetters: Set<string>;
  targetWord: string;
  disabled?: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  guessedLetters,
  targetWord,
  disabled = false,
}) => {
  const getKeyState = (letter: string) => {
    // Check if this letter was guessed
    const isGuessed = Array.from(guessedLetters).some((g) =>
      isArabicCharMatch(g, letter)
    );

    if (!isGuessed) return 'idle';

    // Check if it's in the target word
    const isCorrect = targetWord
      .split('')
      .some((char) => isArabicCharMatch(char, letter));

    return isCorrect ? 'correct' : 'wrong';
  };

  return (
    <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2 select-none">
      {ARABIC_ALPHABET_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 w-full"
        >
          {row.map((letter) => {
            const state = getKeyState(letter);
            const isGuessed = state !== 'idle';

            // Key styles matching the user screenshot with rich shadow and blur
            let btnClass =
              'bg-white/95 hover:bg-white text-slate-800 border-2 border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-lg active:scale-95';

            if (state === 'wrong') {
              // Solid vibrant red key
              btnClass =
                'bg-[#ef4444] text-white border-2 border-red-300 shadow-[0_6px_16px_rgba(239,68,68,0.45)] pointer-events-none';
            } else if (state === 'correct') {
              // Solid vibrant blue key
              btnClass =
                'bg-[#2563eb] text-white border-2 border-blue-300 shadow-[0_6px_16px_rgba(37,99,235,0.45)] pointer-events-none';
            }

            return (
              <button
                key={letter}
                type="button"
                onClick={() => onKeyPress(letter)}
                disabled={disabled || isGuessed}
                className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl md:text-2xl flex items-center justify-center transition-all duration-150 cursor-pointer ${btnClass} ${
                  disabled ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
