import React from 'react';

interface HangmanDisplayProps {
  wrongGuessesCount: number; // 0 to 6
}

export const HangmanDisplay: React.FC<HangmanDisplayProps> = ({
  wrongGuessesCount,
}) => {
  // Glow stroke styles
  const gallowsColor = '#ff7828';
  const stickmanColor = '#ff4d6d';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 200 210"
        className="w-36 h-36 md:w-44 md:h-44 filter drop-shadow-[0_0_8px_rgba(255,120,40,0.5)] transition-all duration-300"
      >
        {/* Base line */}
        <line
          x1="20"
          y1="190"
          x2="140"
          y2="190"
          stroke={gallowsColor}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Vertical Pole */}
        <line
          x1="45"
          y1="190"
          x2="45"
          y2="20"
          stroke={gallowsColor}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Top Horizontal Beam */}
        <line
          x1="42"
          y1="20"
          x2="135"
          y2="20"
          stroke={gallowsColor}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Diagonal support */}
        <line
          x1="45"
          y1="55"
          x2="80"
          y2="20"
          stroke={gallowsColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Rope */}
        <line
          x1="135"
          y1="20"
          x2="135"
          y2="45"
          stroke="#ffa94d"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="4 2"
        />

        {/* Stickman Parts (shown according to mistakes: 1 to 6) */}

        {/* 1. Head */}
        {wrongGuessesCount >= 1 && (
          <circle
            cx="135"
            cy="62"
            r="16"
            stroke={stickmanColor}
            strokeWidth="4.5"
            fill="#ff4d6d15"
            className="animate-pop transition-all"
          />
        )}

        {/* 2. Body */}
        {wrongGuessesCount >= 2 && (
          <line
            x1="135"
            y1="78"
            x2="135"
            y2="128"
            stroke={stickmanColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-pop transition-all"
          />
        )}

        {/* 3. Left Arm */}
        {wrongGuessesCount >= 3 && (
          <line
            x1="135"
            y1="92"
            x2="108"
            y2="115"
            stroke={stickmanColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-pop transition-all"
          />
        )}

        {/* 4. Right Arm */}
        {wrongGuessesCount >= 4 && (
          <line
            x1="135"
            y1="92"
            x2="162"
            y2="115"
            stroke={stickmanColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-pop transition-all"
          />
        )}

        {/* 5. Left Leg */}
        {wrongGuessesCount >= 5 && (
          <line
            x1="135"
            y1="128"
            x2="112"
            y2="168"
            stroke={stickmanColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-pop transition-all"
          />
        )}

        {/* 6. Right Leg (Final mistake) */}
        {wrongGuessesCount >= 6 && (
          <line
            x1="135"
            y1="128"
            x2="158"
            y2="168"
            stroke={stickmanColor}
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-pop transition-all"
          />
        )}
      </svg>
    </div>
  );
};
