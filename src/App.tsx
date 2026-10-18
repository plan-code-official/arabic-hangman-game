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
import ErrorScreen from './components/ErrorScreen/ErrorScreen';
import Celebration from './components/CelebrationWrapper';
import ResultsPanel from './ResultsPanel/ResultsPanel';
import { preloadGameAssets, preloadAudio } from './utils/preloadAssets';

import { Volume2, VolumeX, RotateCcw, Loader2, AlertCircle, Play, Sparkles, Maximize2 } from 'lucide-react';
const bgImage = '/BG.jpeg';
import exitIcon from './assets/ExitButton.svg';
import daddcoinImg from './assets/daddcoin.webp';
const MAX_ATTEMPTS = 6;

// Extract image URL from HTML content (e.g. <img src="...">)
const extractImageFromHtml = (html?: string | null): string | null => {
  if (!html) return null;
  const decoded = html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  const match = decoded.match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i);
  return match ? match[1] : null;
};

// Extract audio URL from HTML content (e.g. <audio src="..."> or <source src="...">)
const extractAudioFromHtml = (html?: string | null): string | null => {
  if (!html) return null;
  const decoded = html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  const matchAudio = decoded.match(/<audio[^>]+src=["']?([^"'\s>]+)["']?/i);
  if (matchAudio) return matchAudio[1];
  const matchSource = decoded.match(/<source[^>]+src=["']?([^"'\s>]+)["']?/i);
  if (matchSource) return matchSource[1];
  return null;
};

// Remove <img> and <audio> tags from HTML string to prevent duplicate/broken inline rendering
const removeMediaTags = (html?: string | null): string => {
  if (!html) return '';
  return html
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')
    .replace(/<audio[^>]*>/gi, '')
    .replace(/<source[^>]*>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/&lt;img[^&]*&gt;/gi, '')
    .trim();
};

const removeImgTags = removeMediaTags;

// Robust check for valid question text (ignores empty HTML, whitespace, img/audio tags, and single ".")
const isValidHint = (hint?: string | null): boolean => {
  if (!hint) return false;
  const stripped = hint
    .replace(/<audio[\s\S]*?<\/audio>/gi, '')
    .replace(/<audio[^>]*>/gi, '')
    .replace(/<source[^>]*>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/&lt;img[^&]*&gt;/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length > 0 && stripped !== '.';
};

export const App: React.FC = () => {
  // 1. Extract URL Parameters on mount
  const [urlParams] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      lessonId: searchParams.get('lessonId'),
      // Optional: when absent, gameApi obtains the token via the refresh endpoint
      token: searchParams.get('token') || '',
    };
  });

  const { lessonId, token } = urlParams;

  // Image failure tracking (ensures broken images from endpoint are hidden gracefully)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Check if an image is provided from endpoints and is valid
  const hasValidImage = useCallback((imageUrl?: string | null): boolean => {
    if (!imageUrl) return false;
    const trimmed = imageUrl.trim();
    return trimmed.length > 0 && trimmed !== bgImage && !failedImages[trimmed];
  }, [failedImages]);

  // API State
  const [apiQuestions, setApiQuestions] = useState<ApiQuestion[]>([]);
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState<boolean>(false);
  const [sessionCompletionData, setSessionCompletionData] = useState<SessionCompletionData | null>(null);
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    return new URLSearchParams(window.location.search).get('started') === 'true';
  });
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
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [isRevealingRightAnswer, setIsRevealingRightAnswer] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isQuestionAudioPlaying, setIsQuestionAudioPlaying] = useState(false);
  const questionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Convert ApiQuestion to WordItem
  const mapApiQuestionToWordItem = useCallback((q: ApiQuestion): WordItem => {
    const rawQuestion = String((q as any).question ?? (q as any).text ?? '');
    const rawHint = (q as any).hint ? String((q as any).hint) : '';
    const extractedImgFromQuestion = extractImageFromHtml(rawQuestion);
    const extractedImgFromHint = extractImageFromHtml(rawHint);

    let parsedOptions: any[] = [];
    if (Array.isArray(q.options)) {
      parsedOptions = q.options;
    } else if (typeof q.options === 'string') {
      try {
        parsedOptions = JSON.parse(q.options);
      } catch (e) {
        parsedOptions = [];
      }
    }

    // 1. Try to find an image in options that matches the correct answer
    const matchingOption = parsedOptions.find(
      (opt: any) => typeof opt !== 'string' && opt?.text?.trim?.() === q.correctAnswer?.trim?.() && (opt.imageUrl || opt.image || opt.image_url)
    );
    const matchingOptImg = matchingOption ? ((matchingOption as any).imageUrl || (matchingOption as any).image || (matchingOption as any).image_url) : null;

    // 2. Try any option that has an image
    const anyImageOption = parsedOptions.find(
      (opt: any) => typeof opt !== 'string' && (opt.imageUrl || opt.image || opt.image_url)
    );
    const anyOptImg = anyImageOption ? ((anyImageOption as any).imageUrl || (anyImageOption as any).image || (anyImageOption as any).image_url) : null;

    // 3. Direct question image property
    const directQuestionImg =
      q.imageUrl ||
      (q as any).image ||
      (q as any).questionImage ||
      (q as any).image_url ||
      (q as any).question_image ||
      (q as any).mediaUrl ||
      (q as any).media ||
      (q as any).photo ||
      (q as any).photoUrl ||
      (q as any).fileUrl;

    // Prioritize direct question image, extracted <img> from question HTML, or option image (only if provided in endpoint)
    const imageUrl =
      directQuestionImg ||
      extractedImgFromQuestion ||
      extractedImgFromHint ||
      matchingOptImg ||
      anyOptImg ||
      undefined;

    const extractedAudioFromQuestion = extractAudioFromHtml(rawQuestion);
    const extractedAudioFromHint = extractAudioFromHtml(rawHint);

    // Direct question audio properties
    const directQuestionAudio =
      q.audioUrl ||
      (q as any).audio ||
      (q as any).audio_url ||
      (q as any).voice ||
      (q as any).voiceUrl ||
      (q as any).voice_url ||
      (q as any).sound ||
      (q as any).soundUrl ||
      (q as any).sound_url ||
      (q as any).mediaAudio ||
      (q as any).fileAudio;

    // Option-level audio properties
    const matchingOptAudio =
      (matchingOption as any)?.audioUrl ||
      (matchingOption as any)?.audio ||
      (matchingOption as any)?.audio_url ||
      (matchingOption as any)?.voice ||
      (matchingOption as any)?.sound;

    const anyAudioOption = parsedOptions.find(
      (opt: any) =>
        typeof opt !== 'string' &&
        (opt?.audioUrl || opt?.audio || opt?.audio_url || opt?.voice || opt?.sound || opt?.soundUrl || opt?.voiceUrl)
    );
    const anyOptAudio = anyAudioOption
      ? ((anyAudioOption as any).audioUrl || (anyAudioOption as any).audio || (anyAudioOption as any).audio_url || (anyAudioOption as any).voice || (anyAudioOption as any).sound || (anyAudioOption as any).soundUrl || (anyAudioOption as any).voiceUrl)
      : null;

    const resolvedAudioUrl =
      directQuestionAudio ||
      extractedAudioFromQuestion ||
      extractedAudioFromHint ||
      matchingOptAudio ||
      anyOptAudio ||
      undefined;

    // Clean question text of <img> and <audio> tags if extracted so text is clear
    const cleanedQuestionText = removeMediaTags(rawQuestion);
    const cleanedHintText = removeMediaTags(rawHint);

    const effectiveText = isValidHint(cleanedQuestionText)
      ? cleanedQuestionText
      : isValidHint(cleanedHintText)
      ? cleanedHintText
      : undefined;

    return {
      id: String(q.id),
      word: cleanArabicWord(q.correctAnswer),
      category: 'all',
      categoryNameAr: lessonTitle || 'سؤال الدرس',
      imageUrl,
      hint: effectiveText,
      audioUrl: resolvedAudioUrl,
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
    if (!lessonId) {
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

      // Preload question audio assets upfront non-blockingly
      fetchedQuestions.forEach((q) => {
        const item = mapApiQuestionToWordItem(q);
        if (item.audioUrl) {
          preloadAudio(item.audioUrl);
        }
      });

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
      setShowGameOverModal(false);
      setIsRevealingRightAnswer(false);
      questionStartTimeRef.current = Date.now();
      setIsDemoMode(false);
    } catch (err: any) {
      console.error('Failed to initialize game session:', err);
      setInitError(err.message || 'حدث خطأ أثناء تحميل أسئلة اللعبة');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, token, mapApiQuestionToWordItem]);

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
    const extractedFirstImg = extractImageFromHtml(firstWord.hint);
    setCurrentWordItem({
      ...firstWord,
      imageUrl: firstWord.imageUrl || extractedFirstImg || undefined,
      hint: extractedFirstImg ? removeImgTags(firstWord.hint) : firstWord.hint,
    });
    setGuessedLetters(new Set());
    setGameStatus('playing');
    setShowGameOverModal(false);
    setIsRevealingRightAnswer(false);
    questionStartTimeRef.current = Date.now();
  }, [activeDemoWordsPool]);

  // Preload Welcome Screen, Celebration, and Results Panel assets
  useEffect(() => {
    preloadGameAssets();
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (lessonId) {
      initializeGame();
    } else {
      setIsLoading(false);
      if (new URLSearchParams(window.location.search).get('started') === 'true') {
        startDemoGame();
      }
    }
  }, [lessonId, token, initializeGame, startDemoGame]);

  // Load question by index
  const loadQuestionByIndex = useCallback((index: number) => {
    setRoundIndex(index);
    setGuessedLetters(new Set());
    setGameStatus('playing');
    setShowGameOverModal(false);
    setIsRevealingRightAnswer(false);
    questionStartTimeRef.current = Date.now();

    if (apiQuestions.length > 0 && apiQuestions[index]) {
      setCurrentWordItem(mapApiQuestionToWordItem(apiQuestions[index]));
    } else {
      // Demo / fallback
      const rand = activeDemoWordsPool[Math.floor(Math.random() * activeDemoWordsPool.length)];
      const extractedRandImg = extractImageFromHtml(rand.hint);
      setCurrentWordItem({
        ...rand,
        imageUrl: rand.imageUrl || extractedRandImg || undefined,
        hint: extractedRandImg ? removeImgTags(rand.hint) : rand.hint,
      });
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
    if (sessionId) {
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

  // Round modal complete handler:
  // If user lost, remove modal, reveal right answer for 1s, then go to next question
  // If user won, proceed directly to next question
  const handleRoundModalComplete = useCallback(() => {
    setShowGameOverModal(false);

    if (gameStatus === 'lost') {
      setIsRevealingRightAnswer(true);

      setTimeout(() => {
        setIsRevealingRightAnswer(false);
        if (roundIndex < totalRounds - 1) {
          loadQuestionByIndex(roundIndex + 1);
        } else {
          handleFinishSession();
        }
      }, 1000); // exactly 1s reveal of right answer
    } else {
      if (roundIndex < totalRounds - 1) {
        loadQuestionByIndex(roundIndex + 1);
      } else {
        handleFinishSession();
      }
    }
  }, [gameStatus, roundIndex, totalRounds, loadQuestionByIndex, handleFinishSession]);

  // Next round handler
  const handleNextRound = useCallback(() => {
    handleRoundModalComplete();
  }, [handleRoundModalComplete]);

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
      if (
        gameStatus !== 'playing' ||
        showGameOverModal ||
        isRevealingRightAnswer ||
        wrongGuessesCount >= MAX_ATTEMPTS ||
        !currentWordItem
      )
        return;

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

          // Short delay so player can see the final solved letter box, then show modal
          setTimeout(() => {
            setGameStatus('won');
            setShowGameOverModal(true);
          }, 600);
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

          // Show wrong answer modal after the wrong guess registers
          setTimeout(() => {
            setGameStatus('lost');
            setShowGameOverModal(true);
          }, 600);
        }
      }
    },
    [gameStatus, showGameOverModal, isRevealingRightAnswer, currentWordItem, guessedLetters, stats, wrongGuessesCount, recordCurrentAnswer]
  );

  // Listen for physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isCategoryModalOpen ||
        isCustomModalOpen ||
        wrongGuessesCount >= MAX_ATTEMPTS ||
        gameStatus !== 'playing' ||
        showGameOverModal ||
        isRevealingRightAnswer ||
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
  }, [handleGuess, isCategoryModalOpen, isCustomModalOpen, wrongGuessesCount, gameStatus, showGameOverModal, isRevealingRightAnswer, sessionCompletionData]);

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
    setShowGameOverModal(false);
    setIsRevealingRightAnswer(false);
    questionStartTimeRef.current = Date.now();
  };

  // Restart entire session
  const restartEntireGame = () => {
    if (lessonId) {
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

  // Toggle or play question audio
  const handleToggleQuestionAudio = useCallback((audioUrl?: string) => {
    if (!audioUrl) return;

    if (isQuestionAudioPlaying && questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current.currentTime = 0;
      setIsQuestionAudioPlaying(false);
      return;
    }

    if (!questionAudioRef.current) {
      questionAudioRef.current = new Audio();
    }

    questionAudioRef.current.src = audioUrl;
    questionAudioRef.current.currentTime = 0;
    questionAudioRef.current.onended = () => setIsQuestionAudioPlaying(false);
    questionAudioRef.current.onerror = () => setIsQuestionAudioPlaying(false);
    questionAudioRef.current
      .play()
      .then(() => setIsQuestionAudioPlaying(true))
      .catch((err) => {
        console.warn('Audio playback error:', err);
        setIsQuestionAudioPlaying(false);
      });
  }, [isQuestionAudioPlaying]);

  // Stop question audio playback whenever question changes or modals open
  useEffect(() => {
    if (questionAudioRef.current) {
      questionAudioRef.current.pause();
      questionAudioRef.current.currentTime = 0;
    }
    setIsQuestionAudioPlaying(false);
  }, [currentWordItem?.id, showGameOverModal, showCelebration, showResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (questionAudioRef.current) {
        questionAudioRef.current.pause();
        questionAudioRef.current = null;
      }
    };
  }, []);

  const handleExitSite = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/'; 
    }
  };

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // RENDER: Error / Missing lessonId Screens
  // -------------------------------------------------------------
  if (!lessonId) {
    return (
      <ErrorScreen
        onExit={handleExitSite}
        description="لا يمكننا العثور على الدرس المطلوب. يرجى التأكد من الرابط أو العودة للرئيسية."
      />
    );
  }

  if (initError) {
    return (
      <ErrorScreen
        onExit={handleExitSite}
        description={
          typeof initError === 'string' && initError.toLowerCase().includes('lessonid')
            ? 'لا يمكننا العثور على الدرس المطلوب. يرجى التأكد من الرابط أو العودة للرئيسية.'
            : initError
        }
      />
    );
  }

  if (!isLoading && apiQuestions.length === 0) {
    return (
      <ErrorScreen
        onExit={handleExitSite}
        description="لم يتم العثور على أي أسئلة لهذا الدرس. يرجى التأكد من محتوى الدرس أو العودة للرئيسية."
      />
    );
  }

  // -------------------------------------------------------------
  // RENDER: Welcome Screen (replaces Loading Spinner)
  // -------------------------------------------------------------
  if (!hasStarted) {
    return (
      <WelcomeScreen
        totalQuestions={apiQuestions.length}
        onStart={() => setHasStarted(true)}
        onExit={handleExitSite}
        isLoading={isLoading}
        error={initError}
      />
    );
  }

  // -------------------------------------------------------------
  // RENDER: Main Game Screen
  // -------------------------------------------------------------
  return (
    <div className="relative h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden selection:bg-blue-600 selection:text-white font-arabic select-none no-scrollbar">
      {/* 1. Fullscreen Wallpaper: Futuristic City & Daylight */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url("${bgImage}")` }}
      />

      {/* 2. Main Game UI Layer */}
      <div className="relative z-10 w-full h-full max-h-[100dvh] flex flex-col justify-between p-1 sm:p-2 md:p-3 overflow-hidden">

        {/* TOP BAR: Glassy Header */}
        <header dir="rtl" className="w-full max-w-5xl mx-auto flex flex-col items-center pt-0.5 sm:pt-1 px-1 sm:px-4 shrink-0">
          <div
            className="w-full rounded-[1.25rem] sm:rounded-[1.5rem] shadow-xl flex flex-col relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/20"
          >

            <div className="py-1 px-2.5 sm:py-2.5 sm:px-4 flex items-center justify-between w-full">
              {/* Right side (RTL Context): Exit Button */}
              <button
                type="button"
                onClick={handleExitSite}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#f8f9fa] hover:bg-white transition-colors rounded-[0.85rem] sm:rounded-[1rem] flex items-center justify-center shadow-lg active:scale-95 shrink-0"
                aria-label="خروج"
              >
                <img src={exitIcon} alt="Exit" className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </button>

              {/* Center: Question Info */}
              <div className="flex flex-col items-center justify-center leading-none text-center">
                <span className="text-white text-[clamp(1.75rem,4.5vw,2.75rem)] font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] tracking-wide mb-0.5">
                  السؤال
                </span>
                <span className="text-white/90 font-black text-sm sm:text-base md:text-xl drop-shadow-md tracking-wider">
                  {roundIndex + 1}/{totalRounds}
                </span>
              </div>

              {/* Left side (RTL Context): Coins Pill */}
              <div dir="ltr" className="flex items-center justify-center bg-transparent border border-white/40 rounded-[2rem] py-1 sm:py-1.5 px-2.5 sm:px-4 gap-1.5 sm:gap-2 shadow-inner shrink-0">
                <img src={daddcoinImg} alt="Coins" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 drop-shadow-md" />
                <span className="text-white font-black text-base sm:text-xl md:text-2xl pt-0.5">{stats.coins}</span>
              </div>
            </div>

            {/* Long Horizontal Progress Bar Perfectly Touching the Header Bottom */}
            <div className="w-full h-1.5 sm:h-2 bg-black/20 border-t border-white/30 p-[1px]">
              <div
                className="h-full transition-all duration-500 shadow-md rounded-r-full"
                style={{ width: `${((roundIndex + 1) / totalRounds) * 100}%`, backgroundColor: '#71D9FF' }}
              />
            </div>
          </div>
        </header>

        {/* UPPER MAIN CARD: [Monster Pod (Left)] | [Clue Image + Clue Text + Word Slots (CENTER)] | [Turns HUD (Right)] */}
        <main dir="ltr" className="w-full max-w-6xl mx-auto my-auto px-1 sm:px-3 md:px-6 lg:px-8 py-0.5 sm:py-1 flex-1 min-h-0 flex flex-col justify-center overflow-hidden">
          <div className="relative w-full h-full min-h-0 flex-1 rounded-[1.25rem] sm:rounded-[2.5rem] bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-3xl border-2 border-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2),0_25px_60px_rgba(15,23,42,0.14)] p-1.5 sm:p-3 lg:p-5 flex flex-col justify-center overflow-hidden">

            {currentWordItem && (() => {
              const extractedImg = extractImageFromHtml(currentWordItem.hint);
              const effectiveImageUrl = currentWordItem.imageUrl || extractedImg || undefined;
              const hasAudio = Boolean(currentWordItem.audioUrl && currentWordItem.audioUrl.trim().length > 0);
              const hasText = isValidHint(currentWordItem.hint);
              const hasImage = hasValidImage(effectiveImageUrl);
              const cleanHint = removeImgTags(currentWordItem.hint) || currentWordItem.hint;

              return (
                <>
                  {/* 1. MOBILE (<= 650px): Dedicated 3-Row Layout */}
                  <div className="question-area-mobile flex-col w-full h-full justify-center items-center gap-1 sm:gap-2 overflow-hidden">
                    {/* ROW 1: Clue Header Row (Sound Icon + Big Text + Static Image with Modal) */}
                    {(hasAudio || hasText || hasImage) && (
                      <div
                        dir="rtl"
                        className={`w-full flex items-center ${
                          hasText ? 'justify-between' : 'justify-center'
                        } gap-2 shrink-0 px-1 pt-0 pb-0.5 min-h-[44px]`}
                      >
                        {/* 1. Sound Button (if provided) */}
                        {hasAudio && (
                          <button
                            type="button"
                            aria-label="تشغيل صوت السؤال"
                            title="استمع إلى صوت السؤال"
                            className={`question-audio-button shrink-0 ${isQuestionAudioPlaying ? 'is-playing' : ''}`}
                            onClick={() => handleToggleQuestionAudio(currentWordItem.audioUrl)}
                          >
                            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                          </button>
                        )}

                        {/* 2. Text Question (Takes remaining space, big font, skipped if ".") */}
                        {hasText && (
                          <div
                            dir="rtl"
                            style={{ fontSize: 'clamp(3.4rem, 17vw, 14rem)' }}
                            className="flex-1 min-w-0 text-center text-white text-[clamp(3.4rem,17vw,14rem)] font-black tracking-wide leading-[1.05] max-h-[180px] overflow-y-auto no-scrollbar px-1 flex items-center justify-center cursor-default [&_img]:max-h-[75px] [&_img]:object-contain [&_img]:inline-block [&_img]:rounded-lg"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).tagName === 'IMG') {
                                setZoomedImage((e.target as HTMLImageElement).src);
                              }
                            }}
                            dangerouslySetInnerHTML={{ __html: cleanHint! }}
                          />
                        )}

                        {/* 3. Static Size Image (clickable to open zoom modal) */}
                        {hasImage && (
                          <button
                            type="button"
                            aria-label="تكبير صورة السؤال"
                            title="انقر لتكبير صورة السؤال"
                            className={`relative shrink-0 rounded-2xl overflow-hidden border-2 border-white/80 shadow-lg group cursor-pointer active:scale-95 transition-transform bg-black/40 backdrop-blur-sm ${
                              hasText
                                ? 'w-[clamp(76px,20vw,100px)] h-[clamp(76px,20vw,100px)]'
                                : 'w-[clamp(120px,36vw,170px)] h-[clamp(120px,36vw,170px)]'
                            }`}
                            onClick={() => setZoomedImage(effectiveImageUrl!)}
                          >
                            <img
                              src={effectiveImageUrl!}
                              alt="سؤال"
                              className="w-full h-full object-contain p-1 transition-transform group-hover:scale-110"
                              onError={() => {
                                if (effectiveImageUrl) {
                                  setFailedImages((prev) => ({ ...prev, [effectiveImageUrl]: true }));
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                              <Maximize2 className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    {/* ROW 2: Hangman Monster (Dedicated Center Stage - Enlarged with reduced padding) */}
                    <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center py-0 relative">
                      <HangmanDisplay
                        wrongGuessesCount={wrongGuessesCount}
                        showThreatBadge={false}
                        sizeClassName="w-[clamp(145px,46vw,240px)] h-[clamp(145px,46vw,240px)] max-h-[min(35vh,240px)]"
                      />
                    </div>

                    {/* ROW 3: Selected Letters (Word Slots - Tightly connected) */}
                    <div className="w-full flex items-center justify-center text-center shrink-0 pt-0 pb-0.5">
                      <WordSlots
                        targetWord={cleanArabicWord(currentWordItem.word)}
                        guessedLetters={guessedLetters}
                        revealAll={isRevealingRightAnswer}
                      />
                    </div>
                  </div>

                  {/* 2. TABLET & DESKTOP (> 650px): 3-Column Balanced Horizontal Layout */}
                  <div className="question-area-desktop flex-row items-center justify-between w-full h-full gap-2 md:gap-4 overflow-hidden">
                    {/* Left Section: Monster Pod */}
                    <div className="shrink-0 z-10 flex items-center justify-center pointer-events-none w-[clamp(120px,22vw,260px)] tablet-monster-pod">
                      <HangmanDisplay
                        wrongGuessesCount={wrongGuessesCount}
                        sizeClassName="tablet-monster-display w-[clamp(120px,18vw,230px)] h-[clamp(120px,18vw,230px)] max-h-[min(30vh,230px)]"
                      />
                    </div>

                    {/* Center Section: Question Clue & Word Slots (Strictly Centered) */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 pointer-events-auto z-20 min-w-0 px-1 sm:px-3 lg:px-6 h-full max-h-full overflow-hidden">
                      {/* Question Clue Row (Sound + Very Big Text + Image in the SAME ROW on Big Screens) */}
                      {(hasAudio || hasText || hasImage) && (
                        <div
                          dir="rtl"
                          className="w-full max-w-5xl flex flex-row items-center justify-center mx-auto shrink transition-all gap-3 sm:gap-4 md:gap-6 px-2 py-1 bg-transparent border-0 shadow-none max-h-[65%] overflow-y-auto no-scrollbar"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).tagName === 'IMG') {
                              setZoomedImage((e.target as HTMLImageElement).src);
                            }
                          }}
                        >
                          {/* 1. Audio (if provided) */}
                          {hasAudio && (
                            <button
                              type="button"
                              aria-label="تشغيل صوت السؤال"
                              title="استمع إلى صوت السؤال"
                              className={`question-audio-button shrink-0 ${isQuestionAudioPlaying ? 'is-playing' : ''}`}
                              onClick={() => handleToggleQuestionAudio(currentWordItem.audioUrl)}
                            >
                              <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                            </button>
                          )}

                          {/* 2. Text / HTML Hint (Very Very Big Text Size in the SAME ROW) */}
                          {hasText && (
                            <div
                              dir="rtl"
                              style={{ fontSize: 'clamp(2.5rem, 12.5vw, 13.2rem)' }}
                              className="flex-1 min-w-0 text-center text-white text-[clamp(2.5rem,12.5vw,13.2rem)] font-black tracking-wide leading-[1.05] max-h-[220px] overflow-y-auto no-scrollbar px-1 flex items-center justify-center cursor-default [&_img]:max-h-[85px] [&_img]:object-contain [&_img]:rounded-xl [&_img]:cursor-zoom-in [&_p]:m-0"
                              dangerouslySetInnerHTML={{ __html: cleanHint! }}
                            />
                          )}

                          {/* 3. Image in the SAME ROW (Side-by-side with text, clickable to zoom) */}
                          {hasImage && (
                            <button
                              type="button"
                              aria-label="تكبير صورة السؤال"
                              title="انقر لتكبير صورة السؤال"
                              className="relative shrink-0 rounded-2xl overflow-hidden border-2 border-white/60 shadow-xl group cursor-pointer active:scale-95 transition-transform bg-black/40 backdrop-blur-sm w-[clamp(80px,11vw,140px)] h-[clamp(80px,11vw,140px)] flex items-center justify-center p-1"
                              onClick={() => setZoomedImage(effectiveImageUrl!)}
                            >
                              <img
                                src={effectiveImageUrl!}
                                alt="سؤال"
                                className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                                onError={() => {
                                  if (effectiveImageUrl) {
                                    setFailedImages((prev) => ({ ...prev, [effectiveImageUrl]: true }));
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                                <Maximize2 className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Word Slots below Clues (Centered) */}
                      <div className="w-full flex items-center justify-center text-center mx-auto shrink-0 mt-0.5 sm:mt-1">
                        <WordSlots
                          targetWord={cleanArabicWord(currentWordItem.word)}
                          guessedLetters={guessedLetters}
                          revealAll={isRevealingRightAnswer}
                        />
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

          </div>
        </main>

        {/* BOTTOM SECTION: Keyboard centered with ultra-glassy card & shadow */}
        <footer className="w-full max-w-5xl mx-auto flex items-center justify-center px-1 sm:px-4 pb-0.5 sm:pb-2 shrink-0 mt-0.5">
          <div className="w-full max-w-xl md:max-w-2xl mx-auto rounded-[1.25rem] sm:rounded-[1.5rem] bg-gradient-to-br from-white/35 via-white/20 to-white/10 backdrop-blur-3xl border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2),0_20px_50px_rgba(15,23,42,0.12)] p-1.5 sm:p-3 flex flex-col items-center justify-center min-h-0">
            {currentWordItem && (
              <VirtualKeyboard
                onKeyPress={handleGuess}
                guessedLetters={guessedLetters}
                targetWord={currentWordItem.word}
                disabled={gameStatus !== 'playing' || showGameOverModal || isRevealingRightAnswer || wrongGuessesCount >= MAX_ATTEMPTS}
              />
            )}
          </div>
        </footer>

      </div>

      {/* MODAL 1: Round End (Won / Lost) */}
      {showGameOverModal && currentWordItem && !sessionCompletionData && !isSubmittingFinal && (
        <GameOverModal
          status={gameStatus === 'won' ? 'won' : 'lost'}
          wordItem={currentWordItem}
          onNextWord={handleRoundModalComplete}
          onRestart={restartCurrentRound}
          streak={stats.streak}
          isLastQuestion={roundIndex >= totalRounds - 1}
          onFinishSession={handleRoundModalComplete}
        />
      )}

      {/* Submitting Answers & Completing Session Overlay */}
      {isSubmittingFinal && (
        <div className="submitting-overlay" aria-busy="true">
          <div className="submitting-spinner" />
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
            onBack={handleExitSite}
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-pop cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full flex flex-col justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 left-2 sm:left-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 backdrop-blur-sm transition-all"
              aria-label="إغلاق"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={zoomedImage}
              alt="صورة مكبرة"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border-2 border-white/20"
            />
            <div
              className="mt-3 text-white/90 text-sm font-bold tracking-widest text-center cursor-pointer"
              onClick={() => setZoomedImage(null)}
            >
              اضغط في أي مكان أو على الزر للإغلاق
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
