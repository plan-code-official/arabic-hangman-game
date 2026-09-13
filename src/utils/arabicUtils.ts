// Arabic letters normalization and utils

export const ARABIC_ALPHABET_ROWS = [
  ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'],
  ['ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط'],
  ['ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م'],
  ['ن', 'ه', 'و', 'ي'],
];

// Flat list of all available keyboard letters
export const ALL_ARABIC_KEYS = ARABIC_ALPHABET_ROWS.flat();

/**
 * Normalizes an Arabic letter or string for flexible matching
 * Maps all variations of Alef (أ, إ, آ, ٱ) -> 'ا'
 * Maps (ة) -> 'ه' (optional)
 * Maps (ى) -> 'ي'
 * Removes Arabic Tashkeel (diacritics)
 */
export function normalizeArabicChar(char: string): string {
  if (!char) return '';
  
  let normalized = char;
  
  // Remove tashkeel / harakat
  normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

  // Normalize Alef
  if (['أ', 'إ', 'آ', 'ٱ', 'ا'].includes(normalized)) {
    return 'ا';
  }
  
  // Normalize Taa Marbuta / Haa (allows 'ه' on keyboard to match 'ة' in words like فراولة and نظارة)
  if (normalized === 'ة') {
    return 'ه';
  }
  
  // Normalize Yaa / Alef Maksura / Hamza on Nabra (e.g. طائرة)
  if (['ى', 'ئ'].includes(normalized)) {
    return 'ي';
  }

  // Normalize Waw with Hamza
  if (normalized === 'ؤ') {
    return 'و';
  }

  return normalized;
}

/**
 * Checks if a guessed letter matches a target word letter
 */
export function isArabicCharMatch(guessedChar: string, targetChar: string): boolean {
  if (guessedChar === targetChar) return true;
  return normalizeArabicChar(guessedChar) === normalizeArabicChar(targetChar);
}

/**
 * Cleans word: removes spaces if needed, removes diacritics
 */
export function cleanArabicWord(word: string): string {
  return word.trim().replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * Checks if user has guessed all letters of the word
 */
export function isWordComplete(word: string, guessedLetters: Set<string>): boolean {
  const letters = cleanArabicWord(word).split('');
  return letters.every(letter => {
    if (letter === ' ') return true; // Spaces are auto-revealed
    return Array.from(guessedLetters).some(guessed => isArabicCharMatch(guessed, letter));
  });
}
