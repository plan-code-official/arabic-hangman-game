export type Category = 
  | 'all' 
  | 'animals' 
  | 'fruits_veggies' 
  | 'objects_tools' 
  | 'vehicles' 
  | 'nature_places' 
  | 'foods' 
  | 'custom';

export interface WordItem {
  id: string;
  word: string; // The word in Arabic (e.g. "أسد", "تفاحة")
  category: Category;
  categoryNameAr: string;
  imageUrl: string; // Direct image URL or inline SVG / Unsplash URL
  hint?: string; // Optional clue
}

export interface GameStats {
  victories: number;
  defeats: number;
  streak: number;
  record: number;
  coins: number;
}

export interface GuessResult {
  letter: string;
  isCorrect: boolean;
}
