import React from 'react';
import GameWelcomeScreen from './GameWelcomeScreen/GameWelcomeScreen';
import questionCoinImg from '../assets/QuestionCoin.png';
import questionNumberBg from '../assets/QuestionNumber.png';
import descriptionImg from '../assets/description.png';
import startButtonImg from '../assets/start_transparent.png';
import goldCoinImg from '../assets/daddcoin.webp';
import exitButtonImg from '../assets/Exit1.png';
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
  const daddPoints = totalQuestions;
  const hasQuestions = totalQuestions > 0;

  if (error) {
    return <div className="welcome-error font-arabic" dir="rtl" style={{ textAlign: 'center', padding: '20px' }}>عذرا حدث خطأ: {error}</div>;
  }

  return (
    <GameWelcomeScreen
      backgroundImage={backgroundImg}
      statsBgImage={questionNumberBg}
      statLeftIcon={questionCoinImg}
      statLeftAlt="عدد الأسئلة"
      statLeftValue={totalQuestions}
      statRightValue={daddPoints}
      statRightIcon={goldCoinImg}
      statRightAlt="النقاط"
      descriptionImage={descriptionImg}
      startButtonImage={startButtonImg}
      exitButtonImage={exitButtonImg}
      onStart={onStart}
      onExit={onExit}
      isLoading={isLoading}
      isReady={hasQuestions}
    />
  );
};

export default WelcomeScreen;
