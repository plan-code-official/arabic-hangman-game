// Welcome Screen Assets
import questionCoinImg from '../assets/QuestionCoin.png';
import questionNumberBg from '../assets/QuestionNumber.png';
import descriptionImg from '../assets/description.png';
import startButtonImg from '../assets/start_transparent.png';
import goldCoinImg from '../assets/daddcoin.webp';
import exitButtonImg from '../assets/Exit1.png';

// Celebration Assets
import celebrationRobots from '../Celebration/assets/celbr.png';
import fireworksSoundUrl from '../Celebration/fireworks.mp3';

// Results Panel Assets
import panelArt from '../assets/results-panel-empty.png';
import celebrationTitle from '../ResultsPanel/assets/good.png';
import retryButtonImage from '../assets/Retry.png';

// Monster Parts Assets
import part1 from '../assets/1m.png';
import part2 from '../assets/2m.webp';
import part3 from '../assets/3m.webp';
import part4 from '../assets/4m.webp';
import part5 from '../assets/5m.webp';
import part6 from '../assets/6m.webp';

const bgImage = '/BG.jpeg';

let isPreloaded = false;

/**
 * Preload a single image with completion handling
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!src || typeof window === 'undefined') {
      resolve();
      return;
    }
    const img = new Image();
    img.src = src;
    if (img.complete) {
      resolve();
    } else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });
};

/**
 * Preload a single audio file (non-blocking)
 */
export const preloadAudio = (src: string): void => {
  if (!src || typeof window === 'undefined') return;
  try {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = src;
    audio.load();
  } catch (_) {
    // Non-blocking fallback
  }
};

/**
 * Preloads all assets for Welcome Screen, Celebration, and Results Panel
 * so they are ready in cache before needed.
 */
export const preloadGameAssets = (): void => {
  if (isPreloaded || typeof window === 'undefined') return;
  isPreloaded = true;

  const imagesToPreload = [
    // 1. Welcome Screen
    bgImage,
    questionCoinImg,
    questionNumberBg,
    descriptionImg,
    startButtonImg,
    goldCoinImg,
    exitButtonImg,

    // 2. Celebration
    celebrationRobots,

    // 3. Results Panel
    panelArt,
    celebrationTitle,
    retryButtonImage,

    // 4. Monster Parts
    part1,
    part2,
    part3,
    part4,
    part5,
    part6,
  ];

  imagesToPreload.forEach((src) => {
    if (src) {
      preloadImage(src);
    }
  });

  if (fireworksSoundUrl) {
    preloadAudio(fireworksSoundUrl);
  }
};

export default preloadGameAssets;
