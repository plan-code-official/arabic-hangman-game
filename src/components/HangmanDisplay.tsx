import React from 'react';
import robotPart1 from '../assets/1m.png';
import robotPart2 from '../assets/2m.webp';
import robotPart3 from '../assets/3m.webp';
import robotPart4 from '../assets/4m.webp';
import robotPart5 from '../assets/5m.webp';
import robotPart6 from '../assets/6m.webp';

interface HangmanDisplayProps {
  wrongGuessesCount: number; // 0 to 6
}

// Exact 6-stage assembly order matching hangman progression
const ROBOT_PARTS = [
  { step: 1, id: 'head', name: 'الرأس', src: robotPart1, zIndex: 'z-30' },
  { step: 2, id: 'torso', name: 'الجسد', src: robotPart2, zIndex: 'z-20' },
  { step: 3, id: 'right-arm', name: 'الذراع الأيمن', src: robotPart3, zIndex: 'z-25' },
  { step: 4, id: 'left-arm', name: 'الذراع الأيسر', src: robotPart4, zIndex: 'z-25' },
  { step: 5, id: 'right-leg', name: 'الساق اليمنى', src: robotPart5, zIndex: 'z-10' },
  { step: 6, id: 'left-leg', name: 'الساق اليسرى', src: robotPart6, zIndex: 'z-10' },
];

export const HangmanDisplay: React.FC<HangmanDisplayProps> = ({
  wrongGuessesCount,
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Floating Robot / Monster Assembly */}
      <div
        className={`relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 xl:w-58 xl:h-58 aspect-square flex items-center justify-center transition-all duration-300 ${
          wrongGuessesCount > 0 ? 'animate-float' : ''
        }`}
      >
        {wrongGuessesCount === 0 ? (
          /* Subtle dormant aura when 0 mistakes */
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center opacity-40">
            <div className="w-8 h-8 rounded-full bg-cyan-400/10 blur-[2px]" />
          </div>
        ) : (
          ROBOT_PARTS.map((part) => {
            const isVisible = wrongGuessesCount >= part.step;
            if (!isVisible) return null;

            const isLatestPart = wrongGuessesCount === part.step;

            return (
              <img
                key={part.id}
                src={part.src}
                alt={part.name}
                className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none ${
                  part.zIndex
                } ${
                  isLatestPart
                    ? 'animate-pop filter drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]'
                    : 'filter drop-shadow-[0_0_6px_rgba(56,189,248,0.3)]'
                } transition-all duration-300`}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
