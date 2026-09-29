import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Category, GameStats, WordItem } from './types/game';
import { INITIAL_WORDS } from './data/wordsData';
import { isArabicCharMatch, isWordComplete, cleanArabicWord } from './utils/arabicUtils';
import { sounds } from './utils/sound';

import {
  fetchGameQuestions,
  startGameSession,
  submitGameAnswers,
  completeGameSession,
  type ApiQuestion,
  type AnswerSubmission,
  type SessionCompletionData,
} from './services/gameApi';

import { HangmanDisplay } from './components/HangmanDisplay';
import { WordSlots } from './components/WordSlots';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { GameOverModal } from './components/GameOverModal';
import { SessionResultModal } from './components/SessionResultModal';
import { CategorySelector } from './components/CategorySelector';
import { CustomWordModal } from './components/CustomWordModal';
import WelcomeScreen from './components/WelcomeScreen';
import Celebration from './components/CelebrationWrapper';
import ResultsPanel from './components/ResultsPanelWrapper';

import { Volume2, VolumeX, RotateCcw, Loader2, AlertCircle, Play, Sparkles } from 'lucide-react';
import bgImage from './assets/Desktop - 91.png';
import exitIcon from './assets/ExitButton.svg';
import daddcoinImg from './assets/daddcoin.webp';
const MAX_ATTEMPTS = 6;
const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600&auto=format&fit=crop&q=80';

export const App: React.FC = () => {
  // 1. Extract URL Parameters on mount
  const [urlParams] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      lessonId: searchParams.get('lessonId'),
      token: searchParams.get('token'),
    };
  });

  const { lessonId, token } = urlParams;

  // API State
  const [apiQuestions, setApiQuestions] = useState<ApiQuestion[]>([]);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);
  const [sessionCompletionData, setSessionCompletionData] = useState<SessionCompletionData | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Accumulated answers for submission: Array of { questionId, selectedAnswer, timeTaken }
  const accumulatedAnswersRef = useRef<AnswerSubmission[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Stats (Local / Persistent) - Coins always start at 0 on fresh load
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('arabic_hangman_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, coins: 0 };
      } catch {
        // Fallback
      }
    }
    return { victories: 0, defeats: 0, streak: 0, record: 0, coins: 0 };
  });

  // Custom words in localStorage
  const [customWords, setCustomWords] = useState<WordItem[]>(() => {
    const saved = localStorage.getItem('arabic_hangman_custom_words');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  // Active Category & Modals
  const [currentCategory, setCurrentCategory] = useState<Category>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Sound Mute state
  const [isMuted, setIsMuted] = useState(sounds.isMuted);

  // Round / Question Session state (0-based index)
  const [roundIndex, setRoundIndex] = useState(0);

  // Game Round State
  const [currentWordItem, setCurrentWordItem] = useState<WordItem | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isQuestionAudioPlaying, setIsQuestionAudioPlaying] = useState(false);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Convert ApiQuestion to WordItem
  const mapApiQuestionToWordItem = useCallback((q: ApiQuestion): WordItem => {
    // 1. Try to find an image in options that matches the correct answer
    const matchingOption = q.options?.find(
      (opt) => opt.text.trim() === q.correctAnswer.trim() && opt.imageUrl
    );
    // 2. Try any option that has an image
    const anyImageOption = q.options?.find((opt) => opt.imageUrl);

    // Prioritize top-level imageUrl from question
    const imageUrl = q.imageUrl || matchingOption?.imageUrl || anyImageOption?.imageUrl || DEFAULT_FALLBACK_IMAGE;

    return {
      id: String(q.id),
      word: cleanArabicWord(q.correctAnswer),
      category: 'all',
      categoryNameAr: lessonTitle || 'سؤال الدرس',
      imageUrl,
      hint: q.question || undefined,
      audioUrl: q.audioUrl || matchingOption?.audioUrl || anyImageOption?.audioUrl || undefined,
    };
  }, [lessonTitle]);

  // Total rounds count
  const totalRounds = useMemo(() => {
    if (apiQuestions.length > 0) return apiQuestions.length;
    return 5;
  }, [apiQuestions]);

  // Start or reset session from API
  const initializeGame = useCallback(async () => {
    // Check if token and lessonId are present
    if (!lessonId || !token) {
      setIsLoading(false);
      setInitError(null);
      // Let user know params are missing, allow Demo Mode
      return;
    }

    try {
      setIsLoading(true);
      setInitError(null);
      setSessionCompletionData(null);
      accumulatedAnswersRef.current = [];

      // A. Fetch Questions
      const questionsRes = await fetchGameQuestions(lessonId, token);
      if (!questionsRes.success || !questionsRes.data?.questions || questionsRes.data.questions.length === 0) {
        throw new Error('لم يتم العثور على أسئلة لهذا الدرس');
      }

      const fetchedQuestions = questionsRes.data.questions;
      setApiQuestions(fetchedQuestions);
      setLessonTitle(questionsRes.data.lessonName || 'تحدي الكلمات');

      // B. Start Game Session (Called once when session begins)
      const sessionRes = await startGameSession(lessonId, token);
      if (!sessionRes.success || !sessionRes.data?.id) {
        throw new Error('تعذر بدء جلسة اللعبة من الخادم');
      }
      setSessionId(sessionRes.data.id);

      // Initialize First Round
      setRoundIndex(0);
      const firstQ = fetchedQuestions[0];
      setCurrentWordItem(mapApiQuestionToWordItem(firstQ));
      setGuessedLetters(new Set());
      setGameStatus('playing');
      questionStartTimeRef.current = Date.now();
      setIsDemoMode(false);
    } catch (err: any) {
      console.error('Failed to initialize game session:', err);
      setInitError(err.message || 'حدث خطأ أثناء تحميل أسئلة اللعبة');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, token, mapApiQuestionToWordItem]);

  // Initialize on mount
  useEffect(() => {
    if (lessonId && token) {
      initializeGame();
    } else {
      setIsLoading(false);
    }
  }, [lessonId, token, initializeGame]);

  // Local/Demo Mode pool
  const activeDemoWordsPool = useMemo(() => {
    const all = [...INITIAL_WORDS, ...customWords];
    if (currentCategory === 'all') return all;
    return all.filter((w) => w.category === currentCategory);
  }, [currentCategory, customWords]);

  // Start Demo Mode
  const startDemoGame = useCallback(() => {
    setIsDemoMode(true);
    setInitError(null);
    setIsLoading(false);
    setRoundIndex(0);
    setSessionCompletionData(null);
    accumulatedAnswersRef.current = [];

    const firstWord = activeDemoWordsPool[Math.floor(Math.random() * activeDemoWordsPool.length)];
    setCurrentWordItem(firstWord);
    setGuessedLetters(new Set());
    setGameStatus('playing');
    questionStartTimeRef.current = Date.now();
  }, [activeDemoWordsPool]);

  // Load question by index
  const loadQuestionByIndex = useCallback((index: number) => {
    setRoundIndex(index);
    setGuessedLetters(new Set());
    setGameStatus('playing');
    questionStartTimeRef.current = Date.now();

    if (apiQuestions.length > 0 && apiQuestions[index]) {
      setCurrentWordItem(mapApiQuestionToWordItem(apiQuestions[index]));
    } else {
      // Demo / fallback
      const rand = activeDemoWordsPool[Math.floor(Math.random() * activeDemoWordsPool.length)];
      setCurrentWordItem(rand);
    }
  }, [apiQuestions, mapApiQuestionToWordItem, activeDemoWordsPool]);

  // Record Answer for current question
  const recordCurrentAnswer = useCallback((isWon: boolean) => {
    const timeTaken = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));

    if (apiQuestions.length > 0 && apiQuestions[roundIndex]) {
      const currentQ = apiQuestions[roundIndex];
      const wrongOption = currentQ.options?.find(opt => opt.text !== currentQ.correctAnswer)?.text || 'خاطئ';
      const submission: AnswerSubmission = {
        questionId: currentQ.id,
        selectedAnswer: isWon ? currentQ.correctAnswer : wrongOption,
        timeTaken,
      };
      accumulatedAnswersRef.current.push(submission);
    } else {
      // Demo answer record
      accumulatedAnswersRef.current.push({
        questionId: roundIndex + 1,
        selectedAnswer: isWon ? (currentWordItem?.word || 'صحيح') : 'خاطئ',
        timeTaken,
      });
    }
  }, [apiQuestions, roundIndex, currentWordItem]);

  // Submit and complete session at the end of the game
  const handleFinishSession = useCallback(async () => {
    setIsSubmittingFinal(true);

    // 1. API Mode
    if (sessionId && token) {
      try {
        // C. Submit Answers (Ensure at least 1 answer is submitted)
        const answersToSubmit = [...accumulatedAnswersRef.current];
        if (answersToSubmit.length === 0) {
          answersToSubmit.push({
            questionId: apiQuestions[0]?.id || 1,
            selectedAnswer: 'none',
            timeTaken: 1,
          });
        }

        await submitGameAnswers(sessionId, answersToSubmit, token);

        // D. Complete Session
        const completeRes = await completeGameSession(sessionId, token);
        if (completeRes.success && completeRes.data) {
          setSessionCompletionData(completeRes.data);

          const correctCount = accumulatedAnswersRef.current.filter(
            (a, idx) => {
              if (a.selectedAnswer === 'خاطئ' || a.selectedAnswer === 'none') return false;
              if (apiQuestions.length > 0 && apiQuestions[idx]) {
                return a.selectedAnswer === apiQuestions[idx].correctAnswer;
              }
              return true;
            }
          ).length;

          if (correctCount / Math.max(1, totalRounds) >= 0.5) {
            setShowCelebration(true);
            sounds.playWin();
          } else {
            setShowResults(true);
          }
        } else {
          throw new Error('لم يتم استلام بيانات إكمال الجلسة');
        }
      } catch (err) {
        console.error('Error submitting/completing session:', err);
        // Fallback local results so user isn't stuck
        const correctCount = accumulatedAnswersRef.current.filter(
          (a, idx) => {
            if (a.selectedAnswer === 'خاطئ' || a.selectedAnswer === 'none') return false;
            if (apiQuestions.length > 0 && apiQuestions[idx]) {
              return a.selectedAnswer === apiQuestions[idx].correctAnswer;
            }
            return true;
          }
        ).length;
        const total = Math.max(1, totalRounds);
        const percentage = Math.round((correctCount / total) * 100);
        const stars = percentage >= 85 ? 3 : percentage >= 50 ? 2 : 1;
        setSessionCompletionData({
          score: correctCount * 20,
          percentage,
          stars,
          coins: 50,
          experience: 120,
          session: { id: sessionId || 'demo', status: 'COMPLETED' },
          reward: null,
          isNewReward: false,
        });

        if (correctCount / total >= 0.5) {
          setShowCelebration(true);
        } else {
          setShowResults(true);
        }
      } finally {
        setIsSubmittingFinal(false);
      }
      return;
    }

    // 2. Demo Mode
    const correctCount = accumulatedAnswersRef.current.filter(
      (a, idx) => {
        if (a.selectedAnswer === 'خاطئ' || a.selectedAnswer === 'none') return false;
        if (apiQuestions.length > 0 && apiQuestions[idx]) {
          return a.selectedAnswer === apiQuestions[idx].correctAnswer;
        }
        return true;
      }
    ).length;
    const total = Math.max(1, totalRounds);
    const percentage = Math.round((correctCount / total) * 100);
    const stars = percentage >= 85 ? 3 : percentage >= 50 ? 2 : 1;

    setSessionCompletionData({
      score: correctCount * 20,
      percentage,
      stars,
      coins: 50,
      experience: 100,
      session: { id: 'demo-session', status: 'COMPLETED' },
      reward: null,
      isNewReward: false,
    });

    if (correctCount / total >= 0.5) {
      setShowCelebration(true);
      sounds.playWin();
    } else {
      setShowResults(true);
    }
    setIsSubmittingFinal(false);
  }, [sessionId, token, apiQuestions, totalRounds]);

  // Next round handler
  const handleNextRound = useCallback(() => {
    if (roundIndex < totalRounds - 1) {
      loadQuestionByIndex(roundIndex + 1);
    } else {
      handleFinishSession();
    }
  }, [roundIndex, totalRounds, loadQuestionByIndex, handleFinishSession]);

  // Save Stats to LocalStorage
  const saveStats = (newStats: GameStats) => {
    setStats(newStats);
    localStorage.setItem('arabic_hangman_stats', JSON.stringify(newStats));
  };

  // Calculate wrong guesses count
  const wrongGuessesCount = useMemo(() => {
    if (!currentWordItem) return 0;
    const targetChars = currentWordItem.word.split('');
    let wrong = 0;

    guessedLetters.forEach((guessed) => {
      const hasMatch = targetChars.some((char) =>
        isArabicCharMatch(char, guessed)
      );
      if (!hasMatch) {
        wrong++;
      }
    });

    return Math.min(wrong, MAX_ATTEMPTS);
  }, [currentWordItem, guessedLetters]);

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - wrongGuessesCount);

  // Handle letter guess
  const handleGuess = useCallback(
    (letter: string) => {
      if (gameStatus !== 'playing' || wrongGuessesCount >= MAX_ATTEMPTS || !currentWordItem) return;

      // Check if already guessed
      const alreadyGuessed = Array.from(guessedLetters).some((g) =>
        isArabicCharMatch(g, letter)
      );
      if (alreadyGuessed) return;

      sounds.playClick();

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      // Check if letter is correct
      const isCorrect = currentWordItem.word
        .split('')
        .some((char) => isArabicCharMatch(char, letter));

      if (isCorrect) {
        sounds.playCorrect();
        // Check if word is now fully solved
        if (isWordComplete(currentWordItem.word, newGuessed)) {
          sounds.playWin();

          const newStreak = stats.streak + 1;
          const newRecord = Math.max(stats.record, newStreak);
          saveStats({
            ...stats,
            victories: stats.victories + 1,
            streak: newStreak,
            record: newRecord,
            coins: stats.coins + 1,
          });

          recordCurrentAnswer(true);

          // Short delay so player can see the final solved letter box
          setTimeout(() => {
            setGameStatus('won');
          }, 800);
        }
      } else {
        sounds.playWrong();
        const newWrongCount = wrongGuessesCount + 1;
        if (newWrongCount >= MAX_ATTEMPTS) {
          sounds.playLose();
          saveStats({
            ...stats,
            defeats: stats.defeats + 1,
            streak: 0,
          });

          recordCurrentAnswer(false);

          // Render the last part of the monster FIRST, let the player see complete assembly, then open modal
          setTimeout(() => {
            setGameStatus('lost');
          }, 1500);
        }
      }
    },
    [gameStatus, currentWordItem, guessedLetters, stats, wrongGuessesCount, recordCurrentAnswer]
  );

  // Listen for physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isCategoryModalOpen ||
        isCustomModalOpen ||
        wrongGuessesCount >= MAX_ATTEMPTS ||
        gameStatus !== 'playing' ||
        sessionCompletionData
      )
        return;

      const key = e.key;
      if (/^[\u0600-\u06FF]$/.test(key)) {
        handleGuess(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, isCategoryModalOpen, isCustomModalOpen, wrongGuessesCount, gameStatus, sessionCompletionData]);

  // Toggle Sound Mute
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Add Custom Word
  const handleAddCustomWord = (newWord: WordItem) => {
    const updated = [newWord, ...customWords];
    setCustomWords(updated);
    localStorage.setItem('arabic_hangman_custom_words', JSON.stringify(updated));
  };

  // Delete Custom Word
  const handleDeleteCustomWord = (id: string) => {
    const updated = customWords.filter((w) => w.id !== id);
    setCustomWords(updated);
    localStorage.setItem('arabic_hangman_custom_words', JSON.stringify(updated));
  };

  // Restart current round
  const restartCurrentRound = () => {
    setGuessedLetters(new Set());
    setGameStatus('playing');
    questionStartTimeRef.current = Date.now();
  };

  // Restart entire session
  const restartEntireGame = () => {
    if (lessonId && token) {
      initializeGame();
    } else {
      startDemoGame();
    }
  };

  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
    setShowResults(true);
  }, []);

  const handleRetry = useCallback(() => {
    setShowResults(false);
    setSessionCompletionData(null);
    setGameStatus('playing');
    setHasStarted(false); // Go back to welcome screen
    saveStats({
      victories: 0,
      defeats: 0,
      streak: 0,
      record: 0,
      coins: 0,
    });
    setRoundIndex(0);
    restartEntireGame();
  }, [restartEntireGame, saveStats]);

  // -------------------------------------------------------------
  // RENDER: Welcome Screen (replaces Loading Spinner)
  // -------------------------------------------------------------
  if (!hasStarted) {
    return (
      <WelcomeScreen
        totalQuestions={isDemoMode ? activeDemoWordsPool.length : apiQuestions.length}
        onStart={() => setHasStarted(true)}
        onExit={() => window.history.back()}
        isLoading={isLoading}
        error={initError}
      />
    );
  }

  // -------------------------------------------------------------
  // RENDER: Initialization Error
  // -------------------------------------------------------------
  if (initError) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center font-arabic select-none p-4">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url("${bgImage}")` }}
        />
        <div className="relative z-10 p-8 rounded-3xl bg-black/75 backdrop-blur-2xl border border-rose-500/40 text-white flex flex-col items-center gap-4 text-center max-w-md shadow-2xl animate-pop">
          <AlertCircle className="w-14 h-14 text-rose-400 animate-shake" />
          <h3 className="text-2xl font-black text-rose-400">عذراً، حدث خطأ!</h3>
          <p className="text-sm text-slate-200 leading-relaxed">{initError}</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <button
              type="button"
              onClick={initializeGame}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-white transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Missing Token / LessonId Notice (User-friendly fallback)
  // -------------------------------------------------------------
  if (!isDemoMode && (!lessonId || !token) && !currentWordItem) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center font-arabic select-none p-4">
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url("${bgImage}")` }}
        />
        <div className="relative z-10 p-6 sm:p-8 rounded-[2.5rem] bg-black/75 backdrop-blur-2xl border border-white/20 text-white flex flex-col items-center gap-4 text-center max-w-md shadow-2xl animate-pop">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">مرحباً بك في تحدي تخمين الكلمات!</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            لم يتم العثور على معرّف الدرس (<code className="text-blue-300 bg-white/10 px-1.5 py-0.5 rounded">lessonId</code>) أو رمز التحقق (<code className="text-blue-300 bg-white/10 px-1.5 py-0.5 rounded">token</code>) في الرابط.
          </p>
          <p className="text-xs text-slate-400">
            إذا كنت قادماً من المنصة التعليمية، يرجى تشغيل اللعبة من داخل الدرس للاستمتاع بحفظ النقاط والمكافآت.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Game Screen
  // -------------------------------------------------------------
  return (
    <div className="relative h-[100dvh] landscape:h-auto landscape:min-h-[100dvh] w-full flex flex-col justify-between overflow-hidden landscape:overflow-y-auto selection:bg-blue-600 selection:text-white font-arabic select-none no-scrollbar">
      {/* 1. Fullscreen Wallpaper: Futuristic City & Daylight */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url("${bgImage}")` }}
      />

      {/* 2. Main Game UI Layer */}
      <div className="relative z-10 w-full h-full landscape:h-auto landscape:min-h-[100dvh] flex flex-col justify-between p-1 sm:p-3 md:p-6 overflow-hidden landscape:overflow-visible">

        {/* TOP BAR: Glassy Header */}
        <header dir="rtl" className="w-full max-w-5xl mx-auto flex flex-col items-center pt-1 px-1 sm:px-4 shrink-0">
          <div
            className="w-full rounded-[1.5rem] shadow-xl flex flex-col relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/20"
          >

            <div className="p-3 sm:p-4 flex items-center justify-between w-full">
              {/* Right side (RTL Context): Exit Button */}
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-12 h-12 sm:w-14 sm:h-14 bg-[#f8f9fa] hover:bg-white transition-colors rounded-[1rem] flex items-center justify-center shadow-lg active:scale-95"
                aria-label="خروج"
              >
                <img src={exitIcon} alt="Exit" className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>

              {/* Center: Question Info */}
              <div className="flex flex-col items-center justify-center -mt-1">
                <span className="text-white text-xl sm:text-2xl font-black drop-shadow-md mb-0">السؤال</span>
                <span className="text-white font-black text-xl sm:text-2xl drop-shadow-md tracking-wider">
                  {roundIndex + 1}/{totalRounds}
                </span>
              </div>

              {/* Left side (RTL Context): Coins Pill */}
              <div dir="ltr" className="flex items-center justify-center bg-transparent border border-white/40 rounded-[2rem] py-1.5 px-4 gap-2 shadow-inner">
                <img src={daddcoinImg} alt="Coins" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md" />
                <span className="text-white font-black text-xl sm:text-2xl pt-1">{stats.coins}</span>
              </div>
            </div>

            {/* Long Horizontal Progress Bar Perfectly Touching the Header Bottom */}
            <div className="w-full h-2 sm:h-2.5 bg-black/20 border-t border-white/30 p-[1px]">
              <div
                className="h-full transition-all duration-500 shadow-md rounded-r-full"
                style={{ width: `${((roundIndex + 1) / totalRounds) * 100}%`, backgroundColor: '#71D9FF' }}
              />
            </div>
          </div>
        </header>

        {/* UPPER MAIN CARD: [Robot (Left)] | [Clue Image + Clue Text + Word Slots (DEAD CENTER)] | [Turns Counter] */}
        <main dir="ltr" className="w-full max-w-6xl mx-auto my-auto px-1 sm:px-10 md:px-14 lg:px-20 py-1 sm:py-4 flex-1 min-h-0 flex flex-col justify-center">
          <div className="relative w-full h-full min-h-0 flex-1 rounded-[1.5rem] sm:rounded-[3rem] bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-3xl border-2 border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2),0_25px_60px_rgba(15,23,42,0.14)] p-2 sm:p-4 lg:p-8 flex flex-row flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-4 lg:gap-0 overflow-visible">

            {/* Left Section: Monster (Top Left on Mobile, Left on Desktop) */}
            <div className="flex-shrink-0 z-10 order-1 lg:order-1 flex items-center justify-start lg:justify-center pointer-events-none w-1/2 lg:w-auto">
              <HangmanDisplay wrongGuessesCount={wrongGuessesCount} />
            </div>

            {/* Right: TURNS CARD (Top Right Corner) */}
            {/* <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 pointer-events-auto">
              <div
                className="w-[clamp(4rem,15vw,6rem)] rounded-xl sm:rounded-2xl bg-black/45 border-2 border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_10px_20px_rgba(0,0,0,0.4)] p-1.5 sm:p-2 lg:p-3 flex flex-col items-center justify-center backdrop-blur-[40px]"
                style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
              >
                <span className="text-white font-black text-xs sm:text-sm lg:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] mb-0.5 sm:mb-1 tracking-wide">
                  Turns
                </span>
                <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-full bg-[#2563eb] border-2 border-white/80 flex items-center justify-center text-white font-black text-sm sm:text-base lg:text-xl shadow-[0_4px_10px_rgba(37,99,235,0.5)]">
                  {remainingAttempts}
                </div>
              </div>
            </div> */}

            {/* Center Section: Question & Word Slots (Bottom on Mobile, Center on Desktop) */}
            <div className="w-full lg:flex-1 order-3 lg:order-2 flex flex-col items-center justify-center text-center gap-1 sm:gap-3 pointer-events-auto z-20 min-w-0 mt-2 lg:mt-0 px-1 lg:px-4">
              {currentWordItem && (
                <>
                  {/* Rich Text Question Container */}
                  <div
                    className="w-full max-w-3xl min-h-[clamp(4rem,10vh,8rem)] flex flex-col items-center justify-center p-2 sm:p-4 mx-auto shrink transition-all overflow-visible gap-3 sm:gap-4"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === 'IMG') {
                        setZoomedImage((e.target as HTMLImageElement).src);
                      }
                    }}
                  >
                    {/* 1. Audio (if provided) */}
                    {currentWordItem.audioUrl && (
                      <button type="button" aria-label="تشغيل صوت السؤال" className={`question-audio-button ${isQuestionAudioPlaying ? 'is-playing' : ''}`} onClick={() => {
                        if (!questionAudioRef.current) questionAudioRef.current = new Audio(currentWordItem.audioUrl!);
                        questionAudioRef.current.src = currentWordItem.audioUrl!;
                        questionAudioRef.current.currentTime = 0;
                        questionAudioRef.current.onended = () => setIsQuestionAudioPlaying(false);
                        questionAudioRef.current.play().then(() => setIsQuestionAudioPlaying(true)).catch(() => setIsQuestionAudioPlaying(false));
                      }}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l4 3V7l-4 3H4Z" /><path d="M15 9a4 4 0 0 1 0 6M17.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
                      </button>
                    )}

                    {/* 2. Image (if provided or as fallback if nothing else exists) */}
                    {currentWordItem.imageUrl && (currentWordItem.imageUrl !== DEFAULT_FALLBACK_IMAGE || (!currentWordItem.hint && !currentWordItem.audioUrl)) && (
                      <img
                        src={currentWordItem.imageUrl !== DEFAULT_FALLBACK_IMAGE ? currentWordItem.imageUrl : bgImage}
                        alt="سؤال"
                        className="max-w-full max-h-[140px] sm:max-h-[180px] object-contain rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.4)] border border-white/20 cursor-zoom-in transition-transform hover:scale-105"
                        onClick={(e) => setZoomedImage((e.target as HTMLImageElement).src)}
                      />
                    )}

                    {/* 3. Text/HTML (if provided) */}
                    {currentWordItem.hint && (
                      <div
                        className="w-full flex flex-col items-center justify-center text-white text-[clamp(1.5rem,5vw,3rem)] font-black tracking-wide drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] gap-2 [&_img]:max-w-full [&_img]:max-h-[140px] [&_img]:object-contain [&_img]:rounded-xl [&_img]:cursor-zoom-in [&_p]:m-0 text-center"
                        dangerouslySetInnerHTML={{ __html: currentWordItem.hint }}
                      />
                    )}
                  </div>

                  {/* Word Slots below Image (Centered) */}
                  <div className="w-full flex items-center justify-center text-center mx-auto">
                    <WordSlots
                      targetWord={cleanArabicWord(currentWordItem.word)}
                      guessedLetters={guessedLetters}
                      revealAll={gameStatus === 'lost'}
                    />
                  </div>
                </>
              )}
            </div>

          </div>
        </main>

        {/* BOTTOM SECTION: Keyboard centered with ultra-glassy card & shadow */}
        <footer className="w-full max-w-5xl mx-auto flex items-center justify-center px-1 sm:px-4 pb-1 sm:pb-3 shrink-0 mt-1">
          <div className="w-full max-w-xl md:max-w-2xl mx-auto rounded-[1.5rem] bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-3xl border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2),0_20px_50px_rgba(15,23,42,0.12)] p-2 sm:p-5 flex flex-col items-center justify-center min-h-0">
            {currentWordItem && (
              <VirtualKeyboard
                onKeyPress={handleGuess}
                guessedLetters={guessedLetters}
                targetWord={currentWordItem.word}
                disabled={gameStatus !== 'playing' || wrongGuessesCount >= MAX_ATTEMPTS}
              />
            )}
          </div>
        </footer>

      </div>

      {/* MODAL 1: Round End (Won / Lost) */}
      {gameStatus !== 'playing' && currentWordItem && !sessionCompletionData && !isSubmittingFinal && (
        <GameOverModal
          status={gameStatus}
          wordItem={currentWordItem}
          onNextWord={handleNextRound}
          onRestart={restartCurrentRound}
          streak={stats.streak}
          isLastQuestion={roundIndex >= totalRounds - 1}
          onFinishSession={handleFinishSession}
        />
      )}

      {/* Submitting Answers & Completing Session Overlay */}
      {isSubmittingFinal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
        </div>
      )}

      {/* MODAL 2: Final Session Results (Celebration & ResultsPanel) */}
      {showCelebration && (
        <Celebration
          isVisible={showCelebration}
          onComplete={handleCelebrationComplete}
          muted={isMuted}
        />
      )}

      {showResults && sessionCompletionData && (() => {
        const correctCount = accumulatedAnswersRef.current.filter((a, idx) => {
          if (a.selectedAnswer === 'خاطئ' || a.selectedAnswer === 'none') return false;
          if (apiQuestions.length > 0 && apiQuestions[idx]) {
            return a.selectedAnswer === apiQuestions[idx].correctAnswer;
          }
          return true;
        }).length;
        const wrongCount = Math.max(0, totalRounds - correctCount);
        const computedScore = correctCount * 20;

        return (
          <ResultsPanel
            score={computedScore}
            totalScore={totalRounds * 20}
            correctAnswers={correctCount}
            wrongAnswers={wrongCount}
            coins={sessionCompletionData.coins || 0}
            onRetry={handleRetry}
            onBack={() => window.history.back()}
          />
        );
      })()}

      {/* Optional Category and Custom Words Modals in Demo Mode */}
      {isCategoryModalOpen && (
        <CategorySelector
          currentCategory={currentCategory}
          onSelectCategory={(cat) => {
            setCurrentCategory(cat);
          }}
          onClose={() => setIsCategoryModalOpen(false)}
          customWordsCount={customWords.length}
        />
      )}

      {isCustomModalOpen && (
        <CustomWordModal
          customWords={customWords}
          onAddWord={handleAddCustomWord}
          onDeleteWord={handleDeleteCustomWord}
          onClose={() => setIsCustomModalOpen(false)}
        />
      )}

      {/* MODAL 3: Zoomed Image Viewer */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-pop cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl w-full flex justify-center items-center">
            <img
              src={zoomedImage}
              alt="صورة مكبرة"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-white/20"
            />
            <div className="absolute -top-10 text-white font-bold tracking-widest animate-pulse">
              اضغط في أي مكان للإغلاق
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
