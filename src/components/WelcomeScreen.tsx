import React from 'react';
import './WelcomeScreen.css';
import questionCoinImg from '../assets/QuestionCoin.png';
import questionNumberBg from '../assets/QuestionNumber.png';
import descriptionImg from '../assets/description.png';
import startButtonImg from '../assets/start_transparent.png';
import goldCoinImg from '../assets/daddcoin.webp';
import exitButtonImg from '../assets/exit_transparent.png';
import backgroundImg from '../assets/Desktop - 91.png';

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
    <div
      className="welcome-screen-new"
      style={{ backgroundImage: `url("${backgroundImg}")` }}
    >
      <div
        className="welcome-stats-bg"
        style={{ backgroundImage: `url(${questionNumberBg})` }}
      >
        <img src={questionCoinImg} alt="Questions" className="stat-icon" />
        <span className="stat-value font-arabic">{totalQuestions}</span>
        <span className="stat-separator">=</span>
        <span className="stat-value xp-value font-arabic">{totalPoints}</span>
        <img src={goldCoinImg} alt="XP" className="stat-icon gold-coin" />
      </div>

      <div className="welcome-body">
        <img src={descriptionImg} alt="How to Play" className="description-img" />
      </div>

      <div className="welcome-footer">
        {error ? (
          <div className="welcome-error font-arabic">عذرا حدث خطأ: {error}</div>
        ) : (
          <>
            <button className="welcome-action-button exit-button" onClick={onExit} aria-label="خروج">
              <img src={exitButtonImg} alt="خروج" />
            </button>
            <button
              className="welcome-action-button start-button"
              onClick={onStart}
              disabled={isLoading || totalQuestions === 0}
              aria-label={isLoading ? 'جاري التحميل' : totalQuestions === 0 ? 'لا توجد أسئلة' : 'ابدأ'}
            >
              <img src={startButtonImg} alt="ابدأ" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WelcomeScreen;
