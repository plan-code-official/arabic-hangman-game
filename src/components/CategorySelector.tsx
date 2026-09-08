import type { Category } from '../types/game';
import { CATEGORIES_LIST } from '../data/wordsData';
import { X, Sparkles, Cat, Apple, Car, Wrench, Mountain, Utensils, PlusCircle } from 'lucide-react';

interface CategorySelectorProps {
  currentCategory: Category;
  onSelectCategory: (category: Category) => void;
  onClose: () => void;
  customWordsCount: number;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  currentCategory,
  onSelectCategory,
  onClose,
  customWordsCount,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Cat': return <Cat className="w-5 h-5" />;
      case 'Apple': return <Apple className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Wrench': return <Wrench className="w-5 h-5" />;
      case 'Mountain': return <Mountain className="w-5 h-5" />;
      case 'Utensils': return <Utensils className="w-5 h-5" />;
      case 'PlusCircle': return <PlusCircle className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-pop">
      <div className="relative w-full max-w-md bg-[#181832] border border-[#373764] rounded-3xl p-5 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2d2d50] mb-4">
          <h2 className="text-xl font-black text-amber-400">اختر تصنيف الكلمات</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#232342] hover:bg-[#303058] text-gray-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
          {CATEGORIES_LIST.map((cat) => {
            const isSelected = currentCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id as Category);
                  onClose();
                }}
                className={`
                  flex items-center gap-2.5 p-3 rounded-2xl border transition text-right
                  ${
                    isSelected
                      ? 'bg-gradient-to-r ' + cat.color + ' border-white/50 text-white font-black shadow-lg scale-[1.02]'
                      : 'bg-[#20203d] hover:bg-[#2a2a50] border-[#34345e] text-gray-200 font-bold'
                  }
                `}
              >
                <div
                  className={`p-2 rounded-xl ${
                    isSelected ? 'bg-black/20' : 'bg-[#181830]'
                  }`}
                >
                  {getIcon(cat.icon)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm">{cat.nameAr}</span>
                  {cat.id === 'custom' && (
                    <span className="text-[11px] opacity-75">
                      ({customWordsCount} كلمات)
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
