import React from 'react';
import robotPart1 from '../assets/1m.png';
import robotPart2 from '../assets/2m.webp';
import robotPart3 from '../assets/3m.webp';
import robotPart4 from '../assets/4m.webp';
import robotPart5 from '../assets/5m.webp';
import robotPart6 from '../assets/6m.webp';

interface HangmanDisplayProps {
  wrongGuessesCount: number; // 0 to 6
  showThreatBadge?: boolean;
  sizeClassName?: string;
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
  showThreatBadge = false,
  sizeClassName,
}) => {
  // Threat level visual style based on mistakes
  const getThreatStyle = () => {
    if (wrongGuessesCount === 0) {
      return {
        glowClass: 'drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]',
        badgeBg: 'bg-cyan-950/70 border-cyan-400/40 text-cyan-300',
        badgeText: '● الوحش في سبات',
      };
    }
    if (wrongGuessesCount <= 2) {
      return {
        glowClass: 'drop-shadow-[0_0_14px_rgba(56,189,248,0.75)]',
        badgeBg: 'bg-cyan-900/80 border-cyan-400/60 text-cyan-200',
        badgeText: `● استيقاظ الوحش (${wrongGuessesCount}/6)`,
      };
    }
    if (wrongGuessesCount <= 4) {
      return {
        glowClass: 'drop-shadow-[0_0_18px_rgba(245,158,11,0.85)]',
        badgeBg: 'bg-amber-950/80 border-amber-400/70 text-amber-200 animate-pulse',
        badgeText: `▲ اقتراب الخطر (${wrongGuessesCount}/6)`,
      };
    }
    return {
      glowClass: 'drop-shadow-[0_0_22px_rgba(239,68,68,0.95)] animate-pulse',
      badgeBg: 'bg-rose-950/90 border-rose-500/80 text-rose-200 animate-pulse',
      badgeText: wrongGuessesCount >= 6 ? '☠️ اكتمل الوحش!' : `⚡ خطر شديد! (${wrongGuessesCount}/6)`,
    };
  };

  const threat = getThreatStyle();

  return (
    <div className="relative flex flex-col items-center justify-center select-none shrink-0 py-0">
      {/* Floating Robot / Monster Assembly Container */}
      <div
        className={`relative ${
          sizeClassName || 'w-[clamp(72px,13vw,160px)] h-[clamp(72px,13vw,160px)] max-h-[min(24vh,160px)]'
        } aspect-square flex items-center justify-center transition-all duration-300 ${
          wrongGuessesCount > 0 ? 'animate-float' : ''
        }`}
      >
        {wrongGuessesCount > 0 &&
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
                    ? `animate-pop filter ${threat.glowClass}`
                    : 'filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                } transition-all duration-300`}
              />
            );
          })}
      </div>

      {showThreatBadge && (
        <div
          className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border backdrop-blur-md shadow-sm transition-all duration-300 ${threat.badgeBg}`}
        >
          {threat.badgeText}
        </div>
      )}
    </div>
  );
};

