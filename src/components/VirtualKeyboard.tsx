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
    <div className="w-full max-w-xl mx-auto px-2 pb-4 flex flex-col items-center gap-1.5 md:gap-2 select-none">
      {ARABIC_ALPHABET_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-center gap-1.5 md:gap-2 w-full"
        >
          {row.map((letter) => {
            const state = getKeyState(letter);
            const isGuessed = state !== 'idle';

            let btnStyle =
              'bg-[#232342] hover:bg-[#32325c] border border-[#3a3a66] text-white hover:border-[#ff7828] active:scale-95';

            if (state === 'correct') {
              btnStyle =
                'bg-emerald-600/90 border border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-[0.98] font-black';
            } else if (state === 'wrong') {
              btnStyle =
                'bg-[#381622] border border-[#6b1e32] text-rose-300/60 opacity-60 pointer-events-none';
            }

            return (
              <button
                key={letter}
                type="button"
                onClick={() => onKeyPress(letter)}
                disabled={disabled || isGuessed}
                className={`
                  flex-1 max-w-[48px] h-10 md:h-12 rounded-xl flex items-center justify-center 
                  text-base md:text-lg font-bold transition-all duration-150 shadow-md
                  disabled:cursor-not-allowed
                  ${btnStyle}
                `}
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
