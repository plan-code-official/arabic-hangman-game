// Arabic letters normalization and utils

export const ARABIC_ALPHABET_ROWS = [
  ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'],
  ['ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط'],
  ['ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م'],
  ['ن', 'ه', 'ة', 'و', 'ي', 'ء', 'ؤ', 'ئ'],
];

// Flat list of all available keyboard letters
export const ALL_ARABIC_KEYS = ARABIC_ALPHABET_ROWS.flat();

/**
 * Normalizes an Arabic letter or string for flexible matching
 * Maps all variations of Alef (أ, إ, آ, ٱ) -> 'ا'
 * Maps Alef Maksura (ى) -> 'ي'
 * Preserves distinct letters ('ة', 'ء', 'ؤ', 'ئ')
 * Removes Arabic Tashkeel (diacritics) and Tatweel
 */
export function normalizeArabicChar(char: string): string {
  if (!char) return '';
  
  let normalized = char.normalize('NFC');

  // Normalize decomposed hamza on nabra (ىٔ) to precomposed ئ
  normalized = normalized.replace(/\u0649\u0654/g, 'ئ');
  
  // Remove tashkeel / harakat and tatweel
  normalized = normalized.replace(/[\u064B-\u065F\u0670\u0640]/g, '');

  // Normalize Alef variations to bare Alef 'ا'
  if (['أ', 'إ', 'آ', 'ٱ', 'ا'].includes(normalized)) {
    return 'ا';
  }
  
  // Normalize Alef Maksura to Yaa
  if (normalized === 'ى') {
    return 'ي';
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
 * Cleans word: removes spaces if needed, removes diacritics and tatweel
 */
export function cleanArabicWord(word: string): string {
  let cleaned = word.trim().normalize('NFC');
  cleaned = cleaned.replace(/\u0649\u0654/g, 'ئ');
  return cleaned.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
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
