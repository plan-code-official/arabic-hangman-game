import React from 'react';
import './WelcomeScreen.css';
import questionCoinImg from '../assets/QuestionCoin.png';
import questionNumberBg from '../assets/QuestionNumber.png';
import descriptionImg from '../assets/description.png';
import startButtonBg from '../assets/startButton.png';
import goldCoinImg from '../assets/daddcoin.webp';
import exitIcon from '../assets/ExitButton.svg';

interface WelcomeScreenProps {
  totalQuestions: number;
  onStart: () => void;
  onExit: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  totalQuestions,
  onStart,
  onExit,
  isLoading = false,
  error = null,
}) => {
  const totalPoints = totalQuestions;

  return (
    <div className="welcome-screen-new">
      <div className="welcome-top-bar">
        <button className="welcome-exit-btn" onClick={onExit} aria-label="خروج">
          <img src={exitIcon} alt="Exit" />
        </button>

        <div
          className="welcome-stats-bg"
          style={{ backgroundImage: `url(${questionNumberBg})` }}
        >
          <div className="stats-equation">
            <img src={questionCoinImg} alt="Questions" className="stat-icon" />
            <span className="stat-value font-arabic">{totalQuestions}</span>
            <span className="stat-separator">=</span>
            <span className="stat-value xp-value font-arabic">{totalPoints}</span>
            <img src={goldCoinImg} alt="XP" className="stat-icon gold-coin" />
          </div>
        </div>
      </div>

      <div className="welcome-body">
        <img src={descriptionImg} alt="How to Play" className="description-img" />
      </div>

      <div className="welcome-footer">
        {error ? (
          <div className="welcome-error font-arabic">عذرا حدث خطأ: {error}</div>
        ) : (
          <button
            className="start-button font-arabic"
            onClick={onStart}
            disabled={isLoading || totalQuestions === 0}
            style={{ backgroundImage: `url(${startButtonBg})` }}
          >
            {isLoading ? 'جاري التحميل...' : totalQuestions === 0 ? 'لا توجد أسئلة' : 'ابدَأ!'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
