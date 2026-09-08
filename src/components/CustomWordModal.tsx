import React, { useState } from 'react';
import type { WordItem } from '../types/game';
import { X, Plus, Trash2, Image, Type, HelpCircle } from 'lucide-react';

interface CustomWordModalProps {
  customWords: WordItem[];
  onAddWord: (word: WordItem) => void;
  onDeleteWord: (id: string) => void;
  onClose: () => void;
}

export const CustomWordModal: React.FC<CustomWordModalProps> = ({
  customWords,
  onAddWord,
  onDeleteWord,
  onClose,
}) => {
  const [wordText, setWordText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hintText, setHintText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordText.trim()) {
      setError('يرجى كتابة الكلمة');
      return;
    }

    const cleanedWord = wordText.trim();
    // Validate Arabic letters
    if (!/^[\u0600-\u06FF\s]+$/.test(cleanedWord)) {
      setError('يرجى إدخال كلمة باللغة العربية فقط');
      return;
    }

    const defaultImg =
      'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=600&auto=format&fit=crop&q=80';

    const newWord: WordItem = {
      id: 'custom-' + Date.now(),
      word: cleanedWord,
      category: 'custom',
      categoryNameAr: 'كلماتي الخاصة',
      imageUrl: imageUrl.trim() || defaultImg,
      hint: hintText.trim() || undefined,
    };

    onAddWord(newWord);
    setWordText('');
    setImageUrl('');
    setHintText('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-pop">
      <div className="relative w-full max-w-md bg-[#181832] border border-[#373764] rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2d2d50] mb-3">
          <h2 className="text-xl font-black text-cyan-400">إضافة كلمات مخصصة</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#232342] hover:bg-[#303058] text-gray-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 mb-4">
          <div>
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1 mb-1">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>الكلمة العربية المراد تخمينها:</span>
            </label>
            <input
              type="text"
              value={wordText}
              onChange={(e) => {
                setWordText(e.target.value);
                setError('');
              }}
              placeholder="مثال: فراشة، ساعة، قمر..."
              className="w-full bg-[#20203e] border border-[#373764] focus:border-cyan-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition"
              dir="rtl"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1 mb-1">
              <Image className="w-3.5 h-3.5 text-amber-400" />
              <span>رابط صورة الشيء (URL - اختياري):</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-[#20203e] border border-[#373764] focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>تلميح مساعدة (اختياري):</span>
            </label>
            <input
              type="text"
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="مثال: حشرة جميلة ملونة تطير بين الأزهار"
              className="w-full bg-[#20203e] border border-[#373764] focus:border-emerald-400 rounded-xl px-3 py-2 text-sm text-white focus:outline-none transition"
              dir="rtl"
            />
          </div>

          {error && <span className="text-xs text-rose-400 font-bold">{error}</span>}

          <button
            type="submit"
            className="w-full mt-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>حفظ وإضافة الكلمة</span>
          </button>
        </form>

        {/* Existing Custom Words List */}
        <div className="flex-1 overflow-y-auto border-t border-[#2d2d50] pt-3">
          <span className="text-xs font-bold text-gray-400 block mb-2">
            الكلمات المضافة ({customWords.length}):
          </span>

          {customWords.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              لم تتم إضافة أي كلمات مخصصة بعد
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {customWords.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-[#1f1f3b] border border-[#2f2f55] p-2 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={item.imageUrl}
                      alt={item.word}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span className="text-sm font-bold text-white">
                      {item.word}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteWord(item.id)}
                    className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
