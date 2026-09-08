import React, { useState } from 'react';
import type { WordItem } from '../types/game';
import { HelpCircle, Eye, EyeOff, Maximize2, Sparkles } from 'lucide-react';

interface ImageClueCardProps {
  currentWord: WordItem;
  onUseHint?: () => void;
  hintUsed: boolean;
}

export const ImageClueCard: React.FC<ImageClueCardProps> = ({
  currentWord,
  onUseHint,
  hintUsed,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showHintText, setShowHintText] = useState(false);

  return (
    <>
      <div className="relative flex flex-col items-center">
        {/* Card Container */}
        <div className="relative group w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-2 border-[#3d3d6b] bg-[#1a1a33] shadow-lg shadow-black/50 transition-all hover:border-[#ff7828]">
          <img
            src={currentWord.imageUrl}
            alt="صورة السؤال"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="eager"
          />

          {/* Category Pill Tag */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{currentWord.categoryNameAr}</span>
          </div>

          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 text-white transition opacity-80 hover:opacity-100"
            title="تكبير الصورة"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clue / Hint Button */}
        {currentWord.hint && (
          <div className="mt-2 w-full flex justify-center">
            <button
              onClick={() => {
                setShowHintText(!showHintText);
                if (onUseHint && !hintUsed) onUseHint();
              }}
              className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 bg-[#1e2342] hover:bg-[#282f58] border border-[#353e74] px-3 py-1 rounded-xl transition shadow"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showHintText ? 'إخفاء التلميح' : 'تلميح الصورة'}</span>
              {showHintText ? <EyeOff className="w-3 h-3 ml-0.5" /> : <Eye className="w-3 h-3 ml-0.5" />}
            </button>
          </div>
        )}

        {/* Hint text popover */}
        {showHintText && currentWord.hint && (
          <div className="mt-1.5 max-w-xs text-center text-xs text-amber-200 bg-amber-950/70 border border-amber-500/40 px-3 py-1.5 rounded-xl animate-pop shadow-lg backdrop-blur-sm">
            💡 {currentWord.hint}
          </div>
        )}
      </div>

      {/* Modal Zoom */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-pop"
        >
          <div className="relative max-w-md w-full bg-[#181830] border border-[#3d3d6b] rounded-3xl p-3 shadow-2xl">
            <img
              src={currentWord.imageUrl}
              alt="صورة مكبرة"
              className="w-full h-80 object-cover rounded-2xl"
            />
            <div className="mt-3 text-center">
              <span className="text-sm font-bold text-amber-400">
                {currentWord.categoryNameAr}
              </span>
              <p className="text-xs text-gray-400 mt-1">اضغط في أي مكان للإغلاق</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
