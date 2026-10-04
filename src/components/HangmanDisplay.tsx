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
  showThreatBadge = true,
}) => {
  // Threat level visual style based on mistakes
  const getThreatStyle = () => {
    if (wrongGuessesCount === 0) {
      return {
        auraColor: 'rgba(56,189,248,0.25)',
        glowClass: 'drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]',
        badgeBg: 'bg-cyan-950/70 border-cyan-400/40 text-cyan-300',
        badgeText: '● الوحش في سبات',
        pedestalGlow: 'from-cyan-500/20 via-cyan-400/10 to-transparent',
        pedestalRing: 'border-cyan-400/30',
      };
    }
    if (wrongGuessesCount <= 2) {
      return {
        auraColor: 'rgba(56,189,248,0.7)',
        glowClass: 'drop-shadow-[0_0_14px_rgba(56,189,248,0.75)]',
        badgeBg: 'bg-cyan-900/80 border-cyan-400/60 text-cyan-200',
        badgeText: `● استيقاظ الوحش (${wrongGuessesCount}/6)`,
        pedestalGlow: 'from-cyan-400/30 via-cyan-500/15 to-transparent',
        pedestalRing: 'border-cyan-400/50 shadow-[0_0_10px_rgba(56,189,248,0.4)]',
      };
    }
    if (wrongGuessesCount <= 4) {
      return {
        auraColor: 'rgba(245,158,11,0.8)',
        glowClass: 'drop-shadow-[0_0_18px_rgba(245,158,11,0.85)]',
        badgeBg: 'bg-amber-950/80 border-amber-400/70 text-amber-200 animate-pulse',
        badgeText: `▲ اقتراب الخطر (${wrongGuessesCount}/6)`,
        pedestalGlow: 'from-amber-500/35 via-amber-400/15 to-transparent',
        pedestalRing: 'border-amber-400/60 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
      };
    }
    return {
      auraColor: 'rgba(239,68,68,0.95)',
      glowClass: 'drop-shadow-[0_0_22px_rgba(239,68,68,0.95)] animate-pulse',
      badgeBg: 'bg-rose-950/90 border-rose-500/80 text-rose-200 animate-pulse',
      badgeText: wrongGuessesCount >= 6 ? '☠️ اكتمل الوحش!' : `⚡ خطر شديد! (${wrongGuessesCount}/6)`,
      pedestalGlow: 'from-rose-600/40 via-rose-500/20 to-transparent',
      pedestalRing: 'border-rose-500/80 shadow-[0_0_16px_rgba(239,68,68,0.7)]',
    };
  };

  const threat = getThreatStyle();

  return (
    <div className="relative flex flex-col items-center justify-center select-none shrink-0 py-0.5 sm:py-1">
      {/* Holographic Pod Frame */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Floating Robot / Monster Assembly Container */}
        <div
          className={`relative w-[clamp(72px,13vw,160px)] h-[clamp(72px,13vw,160px)] max-h-[min(24vh,160px)] aspect-square flex items-center justify-center transition-all duration-300 ${
            wrongGuessesCount > 0 ? 'animate-float' : ''
          }`}
        >

          {wrongGuessesCount === 0 ? (
            /* Futuristic Dormant Hologram State */
            <div className="relative w-full h-full flex flex-col items-center justify-center">

              {/* Dormant Silhouette Silhouette of robot head with subtle pulse */}
              <img
                src={robotPart1}
                alt="الوحش خامل"
                className="absolute inset-0 w-full h-full object-contain opacity-25 filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] grayscale-[40%] transition-opacity duration-500"
              />
              {/* Glowing Core */}
              <div className="absolute w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-cyan-400/60 blur-[3px] animate-pulse" />
            </div>
          ) : (
            /* Monster Robot Parts Assembly */
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
            })
          )}
        </div>

      </div>


    </div>
  );
};

