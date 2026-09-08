import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Category, GameStats, WordItem } from './types/game';
import { INITIAL_WORDS, CATEGORIES_LIST } from './data/wordsData';
import { isArabicCharMatch, isWordComplete, cleanArabicWord } from './utils/arabicUtils';
import { sounds } from './utils/sound';

import { HeaderStats } from './components/HeaderStats';
import { HangmanDisplay } from './components/HangmanDisplay';
import { ImageClueCard } from './components/ImageClueCard';
import { WordSlots } from './components/WordSlots';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { GameOverModal } from './components/GameOverModal';
import { CategorySelector } from './components/CategorySelector';
import { CustomWordModal } from './components/CustomWordModal';

const MAX_ATTEMPTS = 6;

export const App: React.FC = () => {
  // Stats
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

  // Active Category
  const [currentCategory, setCurrentCategory] = useState<Category>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Sound Mute state
  const [isMuted, setIsMuted] = useState(sounds.isMuted);

  // Game Round State
  const [currentWordItem, setCurrentWordItem] = useState<WordItem | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [hintUsed, setHintUsed] = useState(false);

  // Available words for current category
  const activeWordsPool = useMemo(() => {
    const all = [...INITIAL_WORDS, ...customWords];
    if (currentCategory === 'all') return all;
    return all.filter((w) => w.category === currentCategory);
  }, [currentCategory, customWords]);

  // Pick a random word
  const startNewRound = useCallback(() => {
    if (activeWordsPool.length === 0) {
      // If category empty, fall back to initial words
      const rand = INITIAL_WORDS[Math.floor(Math.random() * INITIAL_WORDS.length)];
      setCurrentWordItem(rand);
    } else {
      const rand = activeWordsPool[Math.floor(Math.random() * activeWordsPool.length)];
      setCurrentWordItem(rand);
    }
    setGuessedLetters(new Set());
    setGameStatus('playing');
    setHintUsed(false);
  }, [activeWordsPool]);

  // Initial load
  useEffect(() => {
    startNewRound();
  }, [currentCategory]);

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
      if (gameStatus !== 'playing' || !currentWordItem) return;

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
          setGameStatus('won');
          sounds.playWin();

          const newStreak = stats.streak + 1;
          const newRecord = Math.max(stats.record, newStreak);
          saveStats({
            ...stats,
            victories: stats.victories + 1,
            streak: newStreak,
            record: newRecord,
          });
        }
      } else {
        sounds.playWrong();
        // Calculate mistakes including this one
        const newWrongCount = wrongGuessesCount + 1;
        if (newWrongCount >= MAX_ATTEMPTS) {
          setGameStatus('lost');
          sounds.playLose();
          saveStats({
            ...stats,
            defeats: stats.defeats + 1,
            streak: 0,
          });
        }
      }
    },
    [gameStatus, currentWordItem, guessedLetters, stats, wrongGuessesCount]
  );

  // Listen for real physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCategoryModalOpen || isCustomModalOpen) return;
      const key = e.key;
      // If it's an Arabic character
      if (/^[\u0600-\u06FF]$/.test(key)) {
        handleGuess(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, isCategoryModalOpen, isCustomModalOpen]);

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

  // Category name display
  const categoryInfo = CATEGORIES_LIST.find((c) => c.id === currentCategory);

  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-[#0d0d1c] text-white overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* 1. Header & Stats Bar */}
      <HeaderStats
        stats={stats}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenCategory={() => setIsCategoryModalOpen(true)}
        onOpenCustomWords={() => setIsCustomModalOpen(true)}
        onResetRound={startNewRound}
        currentCategoryName={categoryInfo ? categoryInfo.nameAr : 'الكل'}
      />

      {/* 2. Visual Center Area: Image Clue & Hangman Stickman */}
      <main className="w-full max-w-xl flex-1 flex flex-col items-center justify-center px-4 py-1">
        {currentWordItem && (
          <div className="w-full flex items-center justify-around gap-2 my-2 bg-[#17172e]/60 border border-[#2b2b52] rounded-3xl p-3 md:p-4 backdrop-blur-md shadow-2xl">
            {/* Clue Picture */}
            <ImageClueCard
              currentWord={currentWordItem}
              hintUsed={hintUsed}
              onUseHint={() => setHintUsed(true)}
            />

            {/* Hangman Neon Drawing */}
            <HangmanDisplay
              wrongGuessesCount={wrongGuessesCount}
            />
          </div>
        )}

        {/* 3. Word Slots & Attempts Counter */}
        {currentWordItem && (
          <WordSlots
            targetWord={cleanArabicWord(currentWordItem.word)}
            guessedLetters={guessedLetters}
            revealAll={gameStatus === 'lost'}
            remainingAttempts={remainingAttempts}
          />
        )}
      </main>

      {/* 4. Arabic Virtual Keyboard */}
      {currentWordItem && (
        <VirtualKeyboard
          onKeyPress={handleGuess}
          guessedLetters={guessedLetters}
          targetWord={currentWordItem.word}
          disabled={gameStatus !== 'playing'}
        />
      )}

      {/* Modals */}
      {gameStatus !== 'playing' && currentWordItem && (
        <GameOverModal
          status={gameStatus}
          wordItem={currentWordItem}
          onNextWord={startNewRound}
          onRestart={() => {
            setGuessedLetters(new Set());
            setGameStatus('playing');
          }}
          streak={stats.streak}
        />
      )}

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
