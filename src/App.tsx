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

import { Volume2, VolumeX, RotateCcw, Loader2, AlertCircle, Play, Sparkles } from 'lucide-react';
import bgImage from './assets/Desktop - 91.png';

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

  // Accumulated answers for submission: Array of { questionId, selectedAnswer, timeTaken }
  const accumulatedAnswersRef = useRef<AnswerSubmission[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Stats (Local / Persistent)
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('arabic_hangman_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
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

  // Convert ApiQuestion to WordItem
  const mapApiQuestionToWordItem = useCallback((q: ApiQuestion): WordItem => {
    // 1. Try to find an image in options that matches the correct answer
    const matchingOption = q.options?.find(
      (opt) => opt.text.trim() === q.correctAnswer.trim() && opt.imageUrl
    );
    // 2. Try any option that has an image
    const anyImageOption = q.options?.find((opt) => opt.imageUrl);
    const imageUrl = matchingOption?.imageUrl || anyImageOption?.imageUrl || DEFAULT_FALLBACK_IMAGE;

    return {
      id: String(q.id),
      word: cleanArabicWord(q.correctAnswer),
      category: 'all',
      categoryNameAr: lessonTitle || 'سؤال الدرس',
      imageUrl,
      hint: q.question || undefined,
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
      const submission: AnswerSubmission = {
        questionId: currentQ.id,
        selectedAnswer: isWon ? currentQ.correctAnswer : (currentQ.options?.[0]?.text || 'خاطئ'),
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
          sounds.playWin();
        } else {
          throw new Error('لم يتم استلام بيانات إكمال الجلسة');
        }
      } catch (err) {
        console.error('Error submitting/completing session:', err);
        // Fallback local results so user isn't stuck
        const correctCount = accumulatedAnswersRef.current.filter(
          (a) => a.selectedAnswer !== 'خاطئ' && a.selectedAnswer !== 'none'
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
      } finally {
        setIsSubmittingFinal(false);
      }
      return;
    }

    // 2. Demo Mode
    const correctCount = accumulatedAnswersRef.current.filter(
      (a) => a.selectedAnswer !== 'خاطئ' && a.selectedAnswer !== 'none'
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
    setIsSubmittingFinal(false);
    sounds.playWin();
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

  // -------------------------------------------------------------
  // RENDER: Welcome Screen (replaces Loading Spinner)
  // -------------------------------------------------------------
  if (!hasStarted) {
    return (
      <WelcomeScreen
        questionCount={isDemoMode ? activeDemoWordsPool.length : apiQuestions.length}
        onStart={() => setHasStarted(true)}
        isLoading={isLoading}
        hasError={!!initError}
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
            <button
              type="button"
              onClick={startDemoGame}
              className="py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 font-black text-white transition cursor-pointer"
            >
              الوضع التجريبي
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
            إذا كنت قادماً من المنصة التعليمية، يرجى تشغيل اللعبة من داخل الدرس للاستمتاع بحفظ النقاط والمكافآت. يمكنك أيضاً تجربة اللعبة محلياً الآن:
          </p>
          <button
            type="button"
            onClick={startDemoGame}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-lg shadow-blue-500/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>بدء اللعبة (الوضع التجريبي)</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Game Screen
  // -------------------------------------------------------------
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden selection:bg-blue-600 selection:text-white font-arabic select-none">
      {/* 1. Fullscreen Wallpaper: Futuristic City & Daylight */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url("${bgImage}")` }}
      />

      {/* 2. Main Game UI Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between p-3 sm:p-5 md:p-6">
        
        {/* TOP BAR: [Sound Action Button] | [Center Pill: 01 of 05] | [Reset Button] */}
        <header dir="ltr" className="w-full max-w-5xl mx-auto flex flex-col items-center pt-0 px-1 sm:px-3">
          {/* Top Control Bar Row */}
          <div className="w-full flex items-center justify-between">
            {/* Top Left: Sound Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/30 hover:bg-white/45 border border-white/60 backdrop-blur-2xl flex items-center justify-center text-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_12px_rgba(0,0,0,0.06)] transition active:scale-95 cursor-pointer"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
              ) : (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              )}
            </button>

            {/* Center Pill: "01 of 05" (White bold text in ultra-glassy capsule) */}
            <div
              dir="ltr"
              className="px-7 sm:px-10 py-1 sm:py-1.5 rounded-full bg-white/30 backdrop-blur-2xl border border-white/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_12px_rgba(0,0,0,0.06)] text-white font-black text-sm sm:text-base tracking-widest drop-shadow-md flex items-center justify-center"
            >
              {String(roundIndex + 1).padStart(2, '0')} of {String(totalRounds).padStart(2, '0')}
            </div>

            {/* Top Right: Reset / Menu Button */}
            <button
              type="button"
              onClick={restartCurrentRound}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/30 hover:bg-white/45 border border-white/60 backdrop-blur-2xl flex items-center justify-center text-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_12px_rgba(0,0,0,0.06)] transition active:scale-95 cursor-pointer"
              title="إعادة نفس السؤال"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
            </button>
          </div>

          {/* Long Horizontal Progress Bar Spanning Between Left and Right Edges */}
          <div className="w-full h-2 sm:h-2.5 rounded-full bg-white/40 backdrop-blur-xl border border-white/70 p-[2px] shadow-inner mt-2 sm:mt-3">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all duration-500 shadow-sm"
              style={{ width: `${((roundIndex + 1) / totalRounds) * 100}%` }}
            />
          </div>
        </header>

        {/* UPPER MAIN CARD: [Robot (Left)] | [Clue Image + Clue Text + Word Slots (DEAD CENTER)] | [Turns Counter] */}
        <main dir="ltr" className="w-full max-w-6xl mx-auto my-auto px-4 sm:px-10 md:px-14 lg:px-20 py-3 sm:py-4">
          <div className="relative w-full min-h-[420px] sm:min-h-[460px] md:min-h-[520px] rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-3xl border-2 border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2),0_25px_60px_rgba(15,23,42,0.14)] p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col lg:block items-center justify-between">
            
            {/* Top row container on Mobile to group Monster and Turns */}
            <div className="w-full flex justify-between items-start lg:contents px-2 lg:px-0">
              
              {/* Left Section: Monster */}
              <div className="relative lg:absolute lg:left-4 xl:left-8 lg:top-1/2 lg:-translate-y-1/2 z-10 flex items-center justify-center pointer-events-none">
                <HangmanDisplay wrongGuessesCount={wrongGuessesCount} />
              </div>

              {/* Right: TURNS CARD */}
              <div className="relative lg:absolute lg:right-0 lg:translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 z-30 pointer-events-auto">
                <div
                  className="w-24 sm:w-28 lg:w-32 xl:w-40 rounded-2xl sm:rounded-3xl bg-black/45 border-2 border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_15px_30px_rgba(0,0,0,0.4)] lg:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_25px_50px_rgba(0,0,0,0.4)] p-3 sm:p-4 lg:p-5 xl:p-6 flex flex-col items-center justify-center backdrop-blur-[40px]"
                  style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
                >
                  <span className="text-white font-black text-lg sm:text-xl lg:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] mb-1 sm:mb-2 lg:mb-3 tracking-wide">
                    Turns
                  </span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full bg-[#2563eb] border-2 border-white/80 flex items-center justify-center text-white font-black text-xl lg:text-2xl xl:text-3xl shadow-[0_8px_20px_rgba(37,99,235,0.5)]">
                    {remainingAttempts}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Section: Clue Image, Question Prompt & Blue Word Slots */}
            <div className="relative lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 flex flex-col items-center justify-center text-center gap-2.5 sm:gap-3 pointer-events-auto max-w-md w-full px-2 mx-auto mt-6 sm:mt-8 lg:mt-0">
              {currentWordItem && (
                <>
                  {/* Clue Image Container */}
                  <div className="w-40 sm:w-48 md:w-54 lg:w-64 h-28 sm:h-32 md:h-38 lg:h-46 rounded-2xl overflow-hidden border-2 border-white/95 shadow-[0_12px_30px_rgba(0,0,0,0.2)] bg-slate-100 flex items-center justify-center mx-auto">
                    <img
                      src={currentWordItem.imageUrl}
                      alt="صورة السؤال"
                      className="w-full h-full object-cover object-center"
                      loading="eager"
                    />
                  </div>

                  {/* Question / Clue Text Banner if available */}
                  {currentWordItem.hint && (
                    <div
                      dir="rtl"
                      className="px-4 py-1 sm:py-1.5 rounded-full bg-white/30 border border-white/60 backdrop-blur-xl text-slate-900 font-bold text-xs sm:text-sm drop-shadow-sm max-w-xs sm:max-w-md truncate shadow-sm"
                      title={currentWordItem.hint}
                    >
                      💡 {currentWordItem.hint}
                    </div>
                  )}

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

            {/* Right Placeholder to balance spacing on desktop */}
            <div className="hidden lg:block w-1/4 sm:w-1/3" />

          </div>
        </main>

        {/* BOTTOM SECTION: Keyboard centered with ultra-glassy card & shadow */}
        <footer className="w-full max-w-5xl mx-auto flex items-center justify-center px-4 pt-1 pb-1 sm:pb-3">
          <div className="w-full max-w-xl md:max-w-2xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-3xl border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2),0_20px_50px_rgba(15,23,42,0.12)] p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-pop select-none font-arabic">
          <div className="p-8 rounded-3xl bg-slate-900 border border-white/20 text-white flex flex-col items-center gap-4 text-center max-w-sm shadow-2xl">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            <h3 className="text-xl font-black">جاري إنهاء الجلسة...</h3>
            <p className="text-sm text-slate-300">يتم الآن تسجيل النتائج واحتساب النجوم والمكافآت</p>
          </div>
        </div>
      )}

      {/* MODAL 2: Final Session Results (Score, Stars, Coins, XP) */}
      {sessionCompletionData && (
        <SessionResultModal
          data={sessionCompletionData}
          onRestart={restartEntireGame}
        />
      )}

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
    </div>
  );
};

export default App;
