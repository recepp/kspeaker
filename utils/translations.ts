export type Language = 'en' | 'tr' | 'ar' | 'ru';

type TranslationKey = 
  | 'menu' | 'settings' | 'about' | 'language' | 'login'
  | 'askKspeaker' | 'startConversation' | 'askAnything'
  | 'selectLanguage' | 'englishQuiz' | 'aboutTitle'
  | 'aboutBullet1' | 'aboutBullet2' | 'aboutBullet3' | 'aboutBullet4' | 'aboutBullet5'
  | 'aboutFooter' | 'listening' | 'processing' | 'speaking'
  | 'conversation' | 'teacher' | 'beginner' | 'casual_friend'
  | 'strict' | 'roleplay' | 'business' | 'clearMode' | 'mode'
  | 'lightMode' | 'darkMode' | 'readAloud' | 'networkError'
  | 'waitingApproval' | 'approvalMessage' | 'quotaExceeded'
  | 'quotaMessage' | 'rateLimitTitle' | 'rateLimitMessage' | 'understood';

const translations: Record<TranslationKey, Record<Language, string>> = {
  menu: { en: 'Menu', tr: 'Menü', ar: 'قائمة', ru: 'Меню' },
  settings: { en: 'Settings', tr: 'Ayarlar', ar: 'الإعدادات', ru: 'Настройки' },
  about: { en: 'About Kspeaker', tr: 'Kspeaker Hakkında', ar: 'حول Kspeaker', ru: 'О Kspeaker' },
  language: { en: 'Language', tr: 'Dil', ar: 'اللغة', ru: 'Язык' },
  login: { en: 'Login', tr: 'Giriş Yap', ar: 'تسجيل الدخول', ru: 'Войти' },
  askKspeaker: { en: 'Ask Kspeaker...', tr: 'Kspeaker\'a sor...', ar: 'اسأل Kspeaker...', ru: 'Спросите Kspeaker...' },
  startConversation: { en: 'Start a conversation', tr: 'Sohbete başla', ar: 'ابدأ محادثة', ru: 'Начать разговор' },
  askAnything: { en: 'Ask me anything or use the microphone', tr: 'Bana bir şey sor veya mikrofonu kullan', ar: 'اسألني أي شيء أو استخدم الميكروفون', ru: 'Спросите меня о чем угодно или используйте микрофон' },
  selectLanguage: { en: 'Select Language', tr: 'Dil Seçin', ar: 'اختر اللغة', ru: 'Выберите язык' },
  englishQuiz: { en: 'English Quiz', tr: 'İngilizce Quiz', ar: 'اختبار الإنجليزية', ru: 'Английский квиз' },
  aboutTitle: { en: 'English Practice AI Assistant', tr: 'İngilizce Pratik Yapay Zeka Asistanı', ar: 'مساعد الذكاء الاصطناعي لممارسة الإنجليزية', ru: 'AI-ассистент для практики английского' },
  aboutBullet1: { en: 'Designed specifically for English language practice and conversation', tr: 'İngilizce dil pratiği ve konuşma için özel olarak tasarlandı', ar: 'مصمم خصيصًا لممارسة ومحادثة اللغة الإنجليزية', ru: 'Специально разработан для практики и разговора на английском' },
  aboutBullet2: { en: 'Voice-enabled AI that listens and responds naturally', tr: 'Doğal olarak dinleyen ve yanıt veren sesli AI', ar: 'الذكاء الاصطناعي الصوتي الذي يستمع ويستجيب بشكل طبيعي', ru: 'Голосовой ИИ, который слушает и отвечает естественно' },
  aboutBullet3: { en: 'Helps improve speaking, listening, and conversational skills', tr: 'Konuşma, dinleme ve sohbet becerilerini geliştirmeye yardımcı olur', ar: 'يساعد على تحسين مهارات التحدث والاستماع والمحادثة', ru: 'Помогает улучшить навыки говорения, слушания и разговора' },
  aboutBullet4: { en: 'Real-time feedback and engaging dialogue practice', tr: 'Gerçek zamanlı geri bildirim ve ilgi çekici diyalog pratiği', ar: 'ملاحظات فورية وممارسة حوار جذابة', ru: 'Обратная связь в реальном времени и увлекательная практика диалогов' },
  aboutBullet5: { en: 'Perfect for learners at any level seeking daily practice', tr: 'Günlük pratik arayan her seviyedeki öğrenici için mükemmel', ar: 'مثالي للمتعلمين من أي مستوى يسعون للممارسة اليومية', ru: 'Идеально для учащихся любого уровня, ищущих ежедневную практику' },
  aboutFooter: { en: 'Start speaking and let Kspeaker help you master English!', tr: 'Konuşmaya başlayın ve Kspeaker\'ın İngilizce\'de ustalaşmanıza yardım etmesine izin verin!', ar: 'ابدأ التحدث ودع Kspeaker يساعدك على إتقان الإنجليزية!', ru: 'Начните говорить и позвольте Kspeaker помочь вам освоить английский!' },
  listening: { en: 'Listening...', tr: 'Dinleniyor...', ar: 'الاستماع...', ru: 'Слушаю...' },
  processing: { en: 'Processing...', tr: 'İşleniyor...', ar: 'معالجة...', ru: 'Обработка...' },
  speaking: { en: 'Speaking...', tr: 'Konuşuyor...', ar: 'التحدث...', ru: 'Говорю...' },
  conversation: { en: 'Conversation', tr: 'Sohbet', ar: 'محادثة', ru: 'Разговор' },
  teacher: { en: 'Teacher', tr: 'Öğretmen', ar: 'معلم', ru: 'Учитель' },
  beginner: { en: 'Beginner', tr: 'Başlangıç', ar: 'مبتدئ', ru: 'Начинающий' },
  casual_friend: { en: 'Casual Friend', tr: 'Arkadaş', ar: 'صديق غير رسمي', ru: 'Неформальный друг' },
  strict: { en: 'Strict', tr: 'Sıkı', ar: 'صارم', ru: 'Строгий' },
  roleplay: { en: 'Roleplay', tr: 'Rol Yapma', ar: 'لعب الأدوار', ru: 'Ролевая игра' },
  business: { en: 'Business', tr: 'İş', ar: 'عمل', ru: 'Бизнес' },
  clearMode: { en: 'Clear Mode', tr: 'Modu Temizle', ar: 'مسح الوضع', ru: 'Очистить режим' },
  mode: { en: 'Mode', tr: 'Mod', ar: 'الوضع', ru: 'Режим' },
  lightMode: { en: 'Light Mode', tr: 'Açık Tema', ar: 'وضع فاتح', ru: 'Светлый режим' },
  darkMode: { en: 'Dark Mode', tr: 'Koyu Tema', ar: 'وضع داكن', ru: 'Темный режим' },
  readAloud: { en: 'Read Aloud', tr: 'Sesli Oku', ar: 'اقرأ بصوت عالٍ', ru: 'Читать вслух' },
  networkError: { en: 'No internet connection. Please check your network.', tr: 'İnternet bağlantısı yok. Lütfen ağınızı kontrol edin.', ar: 'لا يوجد اتصال بالإنترنت. يرجى فحص شبكتك.', ru: 'Нет интернет-соединения. Проверьте сеть.' },
  waitingApproval: { en: 'Service Temporarily Unavailable', tr: 'Servis Geçici Olarak Kullanılamıyor', ar: 'الخدمة غير متاحة مؤقتًا', ru: 'Сервис временно недоступен' },
  approvalMessage: { en: 'Our AI service is currently experiencing high demand. Please try again in a few moments.', tr: 'AI hizmetimiz şu anda yoğun talep yaşıyor. Lütfen birkaç dakika sonra tekrar deneyin.', ar: 'تواجه خدمة الذكاء الاصطناعي لدينا طلبًا كبيرًا حاليًا. يرجى المحاولة مرة أخرى بعد لحظات.', ru: 'Наш сервис ИИ в настоящее время испытывает высокий спрос. Попробуйте еще раз через несколько минут.' },
  quotaExceeded: { en: 'Service Usage Limit Reached', tr: 'Servis Kullanım Limiti Doldu', ar: 'تم الوصول إلى حد استخدام الخدمة', ru: 'Достигнут лимит использования' },
  quotaMessage: { en: 'The AI service is currently at capacity. Please try again in a few minutes. We apologize for the inconvenience!', tr: 'AI servisi şu anda kapasite limitinde. Lütfen birkaç dakika sonra tekrar deneyin. Rahatsızlıktan dolayı özür dileriz!', ar: 'خدمة الذكاء الاصطناعي في السعة حاليًا. يرجى المحاولة مرة أخرى بعد بضع دقائق. نعتذر عن الإزعاج!', ru: 'Сервис ИИ в данный момент на пределе мощности. Попробуйте через несколько минут. Приносим извинения!' },
  rateLimitTitle: { en: 'Too Many Requests', tr: 'Çok Fazla İstek', ar: 'طلبات كثيرة جدًا', ru: 'Слишком много запросов' },
  rateLimitMessage: { en: 'You are sending messages too quickly. Please wait a moment and try again.', tr: 'Çok hızlı mesaj gönderiyorsunuz. Lütfen bir dakika bekleyin ve tekrar deneyin.', ar: 'أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار لحظة والمحاولة مرة أخرى.', ru: 'Вы отправляете сообщения слишком быстро. Подождите немного и попробуйте снова.' },
  understood: { en: 'Understood', tr: 'Anladım', ar: 'مفهوم', ru: 'Понятно' },
};

export function getTranslation(key: TranslationKey, language: Language): string {
  return translations[key]?.[language] || translations[key]?.en || key;
}
