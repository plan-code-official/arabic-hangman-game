import React from 'react';
import './WelcomeScreen.css';
import questionCoinImg from '../assets/QuestionCoin.png';
import questionNumberBg from '../assets/QuestionNumber.png';
import descriptionImg from '../assets/description.png';
import startButtonBg from '../assets/startButton.png';
import goldCoinImg from '../assets/daddcoin.webp';

interface WelcomeScreenProps {
  questionCount: number;
  onStart: () => void;
  isLoading?: boolean;
  hasError?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  questionCount,
  onStart,
  isLoading = false,
  hasError = false,
}) => {
  const xpCount = questionCount * 1;

  return (
    <div className="welcome-screen-new">
      <div 
        className="welcome-header" 
        style={{ backgroundImage: `url(${questionNumberBg})` }}
      >
        <div className="welcome-stats-bg">
          <img src={questionCoinImg} alt="Questions" className="stat-icon" />
          <span className="stat-value">{questionCount}</span>
          <span className="stat-separator">{'>'}</span>
          <span className="stat-value xp-value">+{xpCount}</span>
          <img src={goldCoinImg} alt="XP" className="stat-icon gold-coin" />
        </div>
      </div>

      <div className="welcome-body">
        <img src={descriptionImg} alt="How to Play" className="description-img" />
      </div>

      <div className="welcome-footer">
        <button 
          className="start-button" 
          onClick={onStart}
          disabled={isLoading || hasError || questionCount === 0}
          style={{ backgroundImage: `url(${startButtonBg})` }}
        >
          {isLoading ? 'جاري تحميل الأسئلة...' : hasError || questionCount === 0 ? 'لا توجد أسئلة' : 'ابدَأ!'}
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
