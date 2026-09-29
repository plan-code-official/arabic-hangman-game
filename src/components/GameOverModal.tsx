import React, { useEffect } from 'react';
import type { WordItem } from '../types/game';

interface GameOverModalProps {
  status: 'won' | 'lost';
  wordItem: WordItem;
  onNextWord: () => void;
  onRestart: () => void;
  streak: number;
  isLastQuestion?: boolean;
  onFinishSession?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  onNextWord,
  isLastQuestion = false,
  onFinishSession,
}) => {
  const isWon = status === 'won';



  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLastQuestion && onFinishSession) {
        onFinishSession();
      } else {
        onNextWord();
      }
    }, 1500); // 1.5 seconds delay

    return () => clearTimeout(timer);
  }, [isLastQuestion, onFinishSession, onNextWord]);

  return (
    <div className="answer-feedback-overlay fixed inset-0 z-[100] select-none pointer-events-none">
      <div dir="rtl" className={`answer-feedback-card ${isWon ? 'answer-feedback-card--success' : 'answer-feedback-card--wrong'}`}>
        <svg className="answer-feedback__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {isWon ? <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></> : <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>}
        </svg>
        <span className="answer-feedback__text">{isWon ? 'أحسنت!' : 'خطأ'}</span>
      </div>
    </div>
  );
};
