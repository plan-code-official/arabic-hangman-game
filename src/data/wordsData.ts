import type { WordItem } from '../types/game';

export const INITIAL_WORDS: WordItem[] = [
  // Animals (حيوانات)
  {
    id: 'anim-1',
    word: 'أسد',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=600&auto=format&fit=crop&q=80',
    hint: 'ملك الغابة وصاحب الزئير القوي'
  },
  {
    id: 'anim-2',
    word: 'فيل',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&auto=format&fit=crop&q=80',
    hint: 'أكبر حيوان بري وله خرطوم طويل'
  },
  {
    id: 'anim-3',
    word: 'زرافة',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=600&auto=format&fit=crop&q=80',
    hint: 'أطول كائن حي في العالم'
  },
  {
    id: 'anim-4',
    word: 'نمر',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&auto=format&fit=crop&q=80',
    hint: 'حيوان مفترس مخطط باللونين البرتقالي والأسود'
  },
  {
    id: 'anim-5',
    word: 'صقر',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    hint: 'طائر جارح مشهور بحدة بصره وسرعته'
  },
  {
    id: 'anim-6',
    word: 'جمل',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=600&auto=format&fit=crop&q=80',
    hint: 'سفينة الصحراء ويتحمل العطش'
  },
  {
    id: 'anim-7',
    word: 'دلفين',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=600&auto=format&fit=crop&q=80',
    hint: 'حيوان بحري ذكي وصديق للإنسان'
  },
  {
    id: 'anim-8',
    word: 'طاووس',
    category: 'animals',
    categoryNameAr: 'حيوانات',
    imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&auto=format&fit=crop&q=80',
    hint: 'طائر يتميز بريشه الملون الجذاب'
  },

  // Fruits & Veggies (فواكه وخضار)
  {
    id: 'fruit-1',
    word: 'تفاحة',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
    hint: 'فاكهة مشهورة حمراء أو خضراء تبعد الطبيب'
  },
  {
    id: 'fruit-2',
    word: 'موز',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    hint: 'فاكهة صفراء غنية بالبوتاسيوم يحبها القرد'
  },
  {
    id: 'fruit-3',
    word: 'بطيخ',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
    hint: 'فاكهة صيفية كبيرة خضراء من الخارج وحمراء من الداخل'
  },
  {
    id: 'fruit-4',
    word: 'فراولة',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
    hint: 'فاكهة حمراء من التوتيات وبذورها على سطحها الخارجي'
  },
  {
    id: 'fruit-5',
    word: 'برتقال',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=600&auto=format&fit=crop&q=80',
    hint: 'فاكهة حمضية غنية بفيتامين ج واسمها نفس لونها'
  },
  {
    id: 'fruit-6',
    word: 'جزر',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    hint: 'خضار برتقالي يقال إنه يقوي النظر'
  },
  {
    id: 'fruit-7',
    word: 'ليمون',
    category: 'fruits_veggies',
    categoryNameAr: 'فواكه وخضار',
    imageUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&auto=format&fit=crop&q=80',
    hint: 'حامض أصفر يستخدم في العصير والتتبيل'
  },

  // Vehicles (وسائل نقل)
  {
    id: 'veh-1',
    word: 'طائرة',
    category: 'vehicles',
    categoryNameAr: 'وسائل نقل',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
    hint: 'وسيلة نقل تطير في السماء بين السحاب'
  },
  {
    id: 'veh-2',
    word: 'قطار',
    category: 'vehicles',
    categoryNameAr: 'وسائل نقل',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80',
    hint: 'مركبة تسير على قضبان حديدية'
  },
  {
    id: 'veh-3',
    word: 'سفينة',
    category: 'vehicles',
    categoryNameAr: 'وسائل نقل',
    imageUrl: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=600&auto=format&fit=crop&q=80',
    hint: 'مركب ضخم يبحر في البحار والمحيطات'
  },
  {
    id: 'veh-4',
    word: 'دراجة',
    category: 'vehicles',
    categoryNameAr: 'وسائل نقل',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    hint: 'مركبة ذات عجلتين تعتمد على حركة القدمين'
  },
  {
    id: 'veh-5',
    word: 'صاروخ',
    category: 'vehicles',
    categoryNameAr: 'وسائل نقل',
    imageUrl: 'https://images.unsplash.com/photo-1517976487502-5c26b91176b9?w=600&auto=format&fit=crop&q=80',
    hint: 'مركبة فضائية تنطلق بسرعة هائلة نحو الفضاء'
  },
  {
    id: 'veh-6',
    word: 'حافلة',
    category: 'vehicles',
    categoryNameAr: 'وسائل نقل',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    hint: 'سيارة كبيرة تنقل عدداً كبيراً من الركاب والطلاب'
  },

  // Objects & Tools (أدوات وأشياء)
  {
    id: 'obj-1',
    word: 'مفتاح',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    hint: 'أداة معدنية صغيرة لفتح وإغلاق الأقفال والأبواب'
  },
  {
    id: 'obj-2',
    word: 'ساعة',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
    hint: 'أداة لمعرفة الوقت والتوقيت'
  },
  {
    id: 'obj-3',
    word: 'مصباح',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
    hint: 'جهاز يصدر الضوء والإنارة في الظلام'
  },
  {
    id: 'obj-4',
    word: 'كتاب',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    hint: 'مجموعة صفحات تحتوي على المعرفة والقصص'
  },
  {
    id: 'obj-5',
    word: 'نظارة',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
    hint: 'نرتديها على الوجه لتحسين الرؤية أو الحماية من الشمس'
  },
  {
    id: 'obj-6',
    word: 'مطرقة',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80',
    hint: 'أداة نستخدمها لطرق وتثبيت المسامير'
  },
  {
    id: 'obj-7',
    word: 'مقص',
    category: 'objects_tools',
    categoryNameAr: 'أدوات وأشياء',
    imageUrl: 'https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?w=600&auto=format&fit=crop&q=80',
    hint: 'أداة حادة لقص الورق والأقمشة'
  },

  // Nature & Places (طبيعة ومعالم)
  {
    id: 'nat-sea',
    word: 'بحر',
    category: 'nature_places',
    categoryNameAr: 'طبيعة ومعالم',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    hint: 'مسطح مائي واسع ذو مياه مالحة'
  },
  {
    id: 'nat-1',
    word: 'شمس',
    category: 'nature_places',
    categoryNameAr: 'طبيعة ومعالم',
    imageUrl: 'https://images.unsplash.com/photo-1532798369041-b33eb577ef1a?w=600&auto=format&fit=crop&q=80',
    hint: 'النجم المضيء في مركز مجموعتنا الشمسية'
  },
  {
    id: 'nat-2',
    word: 'قمر',
    category: 'nature_places',
    categoryNameAr: 'طبيعة ومعالم',
    imageUrl: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=600&auto=format&fit=crop&q=80',
    hint: 'الجرم السماوي المضيء في سماء الليل'
  },
  {
    id: 'nat-3',
    word: 'بركان',
    category: 'nature_places',
    categoryNameAr: 'طبيعة ومعالم',
    imageUrl: 'https://images.unsplash.com/photo-1465919292275-c60ba49da6ae?w=600&auto=format&fit=crop&q=80',
    hint: 'جبل يثور ويقذف الحمم والرماد الساخن'
  },
  {
    id: 'nat-4',
    word: 'شلال',
    category: 'nature_places',
    categoryNameAr: 'طبيعة ومعالم',
    imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop&q=80',
    hint: 'تدفق مياه عذبة تسقط من مكان مرتفع'
  },
  {
    id: 'nat-5',
    word: 'أهرامات',
    category: 'nature_places',
    categoryNameAr: 'طبيعة ومعالم',
    imageUrl: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&auto=format&fit=crop&q=80',
    hint: 'معالم تاريخية شهيرة في مصر بناها الفراعنة'
  },

  // Foods (أطعمة ومأكولات)
  {
    id: 'food-1',
    word: 'بيتزا',
    category: 'foods',
    categoryNameAr: 'أطعمة ومأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    hint: 'طعام إيطالي شهير دائري الشكل بالجبن والصلصة'
  },
  {
    id: 'food-2',
    word: 'قهوة',
    category: 'foods',
    categoryNameAr: 'أطعمة ومأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    hint: 'مشروب ساخن من حبوب البن يساعد على التركيز'
  },
  {
    id: 'food-3',
    word: 'مثلجات',
    category: 'foods',
    categoryNameAr: 'أطعمة ومأكولات',
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80',
    hint: 'حلوى باردة ومنعشة محبوبة في الصيف'
  }
];

export const CATEGORIES_LIST = [
  { id: 'all', nameAr: 'الكل (تحدي شامل)', icon: 'Sparkles', color: 'from-orange-500 to-amber-500' },
  { id: 'animals', nameAr: 'حيوانات', icon: 'Cat', color: 'from-emerald-500 to-teal-500' },
  { id: 'fruits_veggies', nameAr: 'فواكه وخضار', icon: 'Apple', color: 'from-red-500 to-rose-500' },
  { id: 'vehicles', nameAr: 'وسائل نقل', icon: 'Car', color: 'from-blue-500 to-cyan-500' },
  { id: 'objects_tools', nameAr: 'أدوات وأشياء', icon: 'Wrench', color: 'from-purple-500 to-indigo-500' },
  { id: 'nature_places', nameAr: 'طبيعة ومعالم', icon: 'Mountain', color: 'from-yellow-500 to-amber-600' },
  { id: 'foods', nameAr: 'أطعمة ومأكولات', icon: 'Utensils', color: 'from-pink-500 to-rose-600' },
  { id: 'custom', nameAr: 'كلماتي الخاصة', icon: 'PlusCircle', color: 'from-cyan-500 to-blue-600' },
] as const;
