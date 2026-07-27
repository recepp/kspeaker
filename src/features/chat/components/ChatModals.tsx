import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { saveRegistration } from '../../../../registration';
import { logError } from '../../../../logger';
import type { AppLanguage, Theme } from '../types';
import { modalStyles } from './modalStyles';

export interface ChatModalsProps {
  theme: Theme;
  selectedLanguage: AppLanguage;
  t: (key: string) => string;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void | Promise<void>;
  onToggleTheme: () => void | Promise<void>;
  onSelectLanguage: (lang: AppLanguage) => void | Promise<void>;
  showAbout: boolean;
  onCloseAbout: () => void;
  showSettings: boolean;
  onCloseSettings: () => void;
  onOpenLanguageFromSettings: () => void;
  showLanguage: boolean;
  onCloseLanguage: () => void;
  showApproval: boolean;
  onCloseApproval: () => void;
  errorMessage: string;
  showFaq: boolean;
  onCloseFaq: () => void;
  showSupport: boolean;
  onCloseSupport: () => void;
  showVoucher: boolean;
  onCloseVoucher: () => void;
  supportEmail: string;
  setSupportEmail: (value: string) => void;
  supportMessage: string;
  setSupportMessage: (value: string) => void;
  voucherInput: string;
  setVoucherInput: (value: string) => void;
  voucherSubmitting: boolean;
  setVoucherSubmitting: (value: boolean) => void;
}

export function ChatModals(props: ChatModalsProps) {
  const {
    theme,
    selectedLanguage,
    t,
    notificationsEnabled,
    onToggleNotifications,
    onToggleTheme,
    onSelectLanguage,
    showAbout,
    onCloseAbout,
    showSettings,
    onCloseSettings,
    onOpenLanguageFromSettings,
    showLanguage,
    onCloseLanguage,
    showApproval,
    onCloseApproval,
    errorMessage,
    showFaq,
    onCloseFaq,
    showSupport,
    onCloseSupport,
    showVoucher,
    onCloseVoucher,
    supportEmail,
    setSupportEmail,
    supportMessage,
    setSupportMessage,
    voucherInput,
    setVoucherInput,
    voucherSubmitting,
    setVoucherSubmitting,
  } = props;

  return (
    <>
      {/* About Modal */}
      {showAbout && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={[modalStyles.modalHeader, theme === 'light' && modalStyles.modalHeaderLight]}>
              <Text style={[modalStyles.modalTitle, theme === 'light' && modalStyles.modalTitleLight]}>{t('about')}</Text>
              <TouchableOpacity onPress={() => onCloseAbout()}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.modalBody}>
              <Text style={modalStyles.aboutTitle}>{t('aboutTitle')}</Text>
              <View style={modalStyles.aboutSection}>
                <View style={modalStyles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.aboutText, theme === 'light' && modalStyles.aboutTextLight]}>
                    {t('aboutBullet1')}
                  </Text>
                </View>
                <View style={modalStyles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.aboutText, theme === 'light' && modalStyles.aboutTextLight]}>
                    {t('aboutBullet2')}
                  </Text>
                </View>
                <View style={modalStyles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.aboutText, theme === 'light' && modalStyles.aboutTextLight]}>
                    {t('aboutBullet3')}
                  </Text>
                </View>
                <View style={modalStyles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.aboutText, theme === 'light' && modalStyles.aboutTextLight]}>
                    {t('aboutBullet4')}
                  </Text>
                </View>
                <View style={modalStyles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.aboutText, theme === 'light' && modalStyles.aboutTextLight]}>
                    {t('aboutBullet5')}
                  </Text>
                </View>
              </View>
              <Text style={modalStyles.aboutFooter}>
                {t('aboutFooter')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={[modalStyles.modalHeader, theme === 'light' && modalStyles.modalHeaderLight]}>
              <Text style={[modalStyles.modalTitle, theme === 'light' && modalStyles.modalTitleLight]}>{t('settings')}</Text>
              <TouchableOpacity onPress={() => onCloseSettings()}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.modalBody}>
              {/* Günlük Hatırlatıcı */}
              <View style={modalStyles.settingsItem}>
                <View style={modalStyles.settingsItemLeft}>
                  <Ionicons name="notifications-outline" size={24} color={theme === 'dark' ? '#7DD3C0' : '#4A9B8F'} />
                  <Text style={[modalStyles.settingsItemText, theme === 'light' && modalStyles.settingsItemTextLight]}>
                    {t('dailyReminder')}
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={onToggleNotifications}
                  trackColor={{ false: '#767577', true: '#7DD3C0' }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              
              <View style={modalStyles.settingsDivider} />
              
              {/* Tema */}
              <TouchableOpacity style={modalStyles.settingsItem} onPress={onToggleTheme}>
                <View style={modalStyles.settingsItemLeft}>
                  <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
                  <Text style={[modalStyles.settingsItemText, theme === 'light' && modalStyles.settingsItemTextLight]}>
                    {theme === 'dark' ? t('lightMode') : t('darkMode')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
              
              <View style={modalStyles.settingsDivider} />
              
              {/* Dil */}
              <TouchableOpacity 
                style={modalStyles.settingsItem} 
                onPress={onOpenLanguageFromSettings}
              >
                <View style={modalStyles.settingsItemLeft}>
                  <Ionicons name="language" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
                  <Text style={[modalStyles.settingsItemText, theme === 'light' && modalStyles.settingsItemTextLight]}>
                    {t('language')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Language Modal */}
      {showLanguage && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={[modalStyles.modalHeader, theme === 'light' && modalStyles.modalHeaderLight]}>
              <Text style={[modalStyles.modalTitle, theme === 'light' && modalStyles.modalTitleLight]}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => onCloseLanguage()}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.modalBody}>
              <TouchableOpacity 
                style={[
                  modalStyles.languageOption,
                  theme === 'light' && modalStyles.languageOptionLight,
                  selectedLanguage === 'en' && modalStyles.languageOptionSelected
                ]}
                onPress={() => onSelectLanguage('en')}
              >
                <Text style={modalStyles.languageFlag}>🇬🇧</Text>
                <Text style={[modalStyles.languageText, theme === 'light' && modalStyles.languageTextLight]}>English</Text>
                {selectedLanguage === 'en' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  modalStyles.languageOption,
                  theme === 'light' && modalStyles.languageOptionLight,
                  selectedLanguage === 'tr' && modalStyles.languageOptionSelected
                ]}
                onPress={() => onSelectLanguage('tr')}
              >
                <Text style={modalStyles.languageFlag}>🇹🇷</Text>
                <Text style={[modalStyles.languageText, theme === 'light' && modalStyles.languageTextLight]}>Türkçe</Text>
                {selectedLanguage === 'tr' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  modalStyles.languageOption,
                  theme === 'light' && modalStyles.languageOptionLight,
                  selectedLanguage === 'ar' && modalStyles.languageOptionSelected
                ]}
                onPress={() => onSelectLanguage('ar')}
              >
                <Text style={modalStyles.languageFlag}>🇸🇦</Text>
                <Text style={[modalStyles.languageText, theme === 'light' && modalStyles.languageTextLight]}>العربية</Text>
                {selectedLanguage === 'ar' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  modalStyles.languageOption,
                  theme === 'light' && modalStyles.languageOptionLight,
                  selectedLanguage === 'ru' && modalStyles.languageOptionSelected
                ]}
                onPress={() => onSelectLanguage('ru')}
              >
                <Text style={modalStyles.languageFlag}>🇷🇺</Text>
                <Text style={[modalStyles.languageText, theme === 'light' && modalStyles.languageTextLight]}>Русский</Text>
                {selectedLanguage === 'ru' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Error/Approval Modal */}
      {showApproval && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={modalStyles.approvalIconContainer}>
              <Ionicons 
                name={
                  errorMessage === t('rateLimitMessage') ? 'timer-outline' : 
                  errorMessage === t('quotaMessage') ? 'shield-checkmark-outline' :
                  'alert-circle-outline'
                }
                size={64} 
                color={
                  errorMessage === t('rateLimitMessage') ? '#3B82F6' : 
                  errorMessage === t('quotaMessage') ? '#10B981' :
                  (theme === 'dark' ? '#F59E0B' : '#EF4444')
                } 
              />
            </View>
            <Text style={[modalStyles.approvalTitle, theme === 'light' && modalStyles.approvalTitleLight]}>
              {
                errorMessage === t('rateLimitMessage') ? t('rateLimitTitle') : 
                errorMessage === t('quotaMessage') ? t('quotaExceeded') :
                t('waitingApproval')
              }
            </Text>
            <Text style={[modalStyles.approvalMessage, theme === 'light' && modalStyles.approvalMessageLight]}>
              {errorMessage || t('approvalMessage')}
            </Text>
            <TouchableOpacity 
              style={[modalStyles.approvalButton, theme === 'light' && modalStyles.approvalButtonLight]}
              onPress={() => {
                onCloseApproval();
              }}
            >
              <Text style={modalStyles.approvalButtonText}>{t('understood')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAQ Modal */}
      {showFaq && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={[modalStyles.modalHeader, theme === 'light' && modalStyles.modalHeaderLight]}>
              <Text style={[modalStyles.modalTitle, theme === 'light' && modalStyles.modalTitleLight]}>{t('faq')}</Text>
              <TouchableOpacity onPress={() => onCloseFaq()}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={modalStyles.modalBody}>
              <View style={modalStyles.faqItem}>
                <View style={modalStyles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.faqQuestionText, theme === 'light' && modalStyles.faqQuestionTextLight]}>
                    {selectedLanguage === 'tr' ? 'Kspeaker nedir?' : 
                     selectedLanguage === 'ar' ? 'ما هو Kspeaker؟' :
                     selectedLanguage === 'ru' ? 'Что такое Kspeaker?' :
                     'What is Kspeaker?'}
                  </Text>
                </View>
                <Text style={[modalStyles.faqAnswer, theme === 'light' && modalStyles.faqAnswerLight]}>
                  {selectedLanguage === 'tr' ? 'Kspeaker, İngilizce pratiği için tasarlanmış yapay zeka destekli bir asistanıdır.' :
                   selectedLanguage === 'ar' ? 'Kspeaker هو مساعد مدعوم بالذكاء الاصطناعي لممارسة اللغة الإنجليزية.' :
                   selectedLanguage === 'ru' ? 'Kspeaker - это AI-помощник для практики английского языка.' :
                   'Kspeaker is an AI-powered assistant designed for English practice.'}
                </Text>
              </View>
              <View style={modalStyles.faqItem}>
                <View style={modalStyles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.faqQuestionText, theme === 'light' && modalStyles.faqQuestionTextLight]}>
                    {selectedLanguage === 'tr' ? 'Sesli konuşma nasıl çalışır?' :
                     selectedLanguage === 'ar' ? 'كيف تعمل المحادثة الصوتية؟' :
                     selectedLanguage === 'ru' ? 'Как работает голосовой разговор?' :
                     'How does voice conversation work?'}
                  </Text>
                </View>
                <Text style={[modalStyles.faqAnswer, theme === 'light' && modalStyles.faqAnswerLight]}>
                  {selectedLanguage === 'tr' ? 'Mikrofon butonuna basın ve konuşun. AI sizi dinler ve yanıt verir.' :
                   selectedLanguage === 'ar' ? 'اضغط على زر الميكروفون وتحدث. يستمع الذكاء الاصطناعي ويستجيب.' :
                   selectedLanguage === 'ru' ? 'Нажмите кнопку микрофона и говорите. ИИ слушает и отвечает.' :
                   'Press the microphone button and speak. AI listens and responds.'}
                </Text>
              </View>
              <View style={modalStyles.faqItem}>
                <View style={modalStyles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.faqQuestionText, theme === 'light' && modalStyles.faqQuestionTextLight]}>
                    {selectedLanguage === 'tr' ? 'Flash Cards nedir?' :
                     selectedLanguage === 'ar' ? 'ما هي البطاقات التعليمية؟' :
                     selectedLanguage === 'ru' ? 'Что такое флэш-карты?' :
                     'What are Flash Cards?'}
                  </Text>
                </View>
                <Text style={[modalStyles.faqAnswer, theme === 'light' && modalStyles.faqAnswerLight]}>
                  {selectedLanguage === 'tr' ? 'Flash Cards kelime dağarcığınızı geliştirmek için etkileşimli kartlardır.' :
                   selectedLanguage === 'ar' ? 'البطاقات التعليمية بطاقات تفاعلية لتحسين مفرداتك.' :
                   selectedLanguage === 'ru' ? 'Флэш-карты - интерактивные карточки для улучшения словарного запаса.' :
                   'Flash Cards are interactive cards to improve your vocabulary.'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Support Modal */}
      {showSupport && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={[modalStyles.modalHeader, theme === 'light' && modalStyles.modalHeaderLight]}>
              <Text style={[modalStyles.modalTitle, theme === 'light' && modalStyles.modalTitleLight]}>{t('support')}</Text>
              <TouchableOpacity onPress={onCloseSupport}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={modalStyles.modalBody}>
              <View style={modalStyles.supportSection}>
                <Ionicons name="mail" size={48} color="#7DD3C0" style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Text style={[modalStyles.supportTitle, theme === 'light' && modalStyles.supportTitleLight]}>
                  {selectedLanguage === 'tr' ? 'İletişime Geçin' :
                   selectedLanguage === 'ar' ? 'اتصل بنا' :
                   selectedLanguage === 'ru' ? 'Свяжитесь с нами' :
                   'Get in Touch'}
                </Text>
                <Text style={[modalStyles.supportText, theme === 'light' && modalStyles.supportTextLight]}>
                  {selectedLanguage === 'tr' ? 'Sorularınız veya önerileriniz için bizimle iletişime geçin.' :
                   selectedLanguage === 'ar' ? 'اتصل بنا إذا كان لديك أسئلة أو اقتراحات.' :
                   selectedLanguage === 'ru' ? 'Свяжитесь с нами, если у вас есть вопросы или предложения.' :
                   'Contact us with your questions or suggestions.'}
                </Text>
              </View>

              {/* Email Input */}
              <View style={modalStyles.supportInputContainer}>
                <Text style={[modalStyles.supportInputLabel, theme === 'light' && modalStyles.supportInputLabelLight]}>
                  {selectedLanguage === 'tr' ? 'E-posta Adresiniz' :
                   selectedLanguage === 'ar' ? 'عنوان بريدك الإلكتروني' :
                   selectedLanguage === 'ru' ? 'Ваш email' :
                   'Your Email'}
                </Text>
                <TextInput
                  style={[modalStyles.supportInput, theme === 'light' && modalStyles.supportInputLight]}
                  placeholder={selectedLanguage === 'tr' ? 'ornek@email.com' :
                              selectedLanguage === 'ar' ? 'example@email.com' :
                              selectedLanguage === 'ru' ? 'пример@email.com' :
                              'example@email.com'}
                  placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={supportEmail}
                  onChangeText={setSupportEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Message Input */}
              <View style={modalStyles.supportInputContainer}>
                <Text style={[modalStyles.supportInputLabel, theme === 'light' && modalStyles.supportInputLabelLight]}>
                  {selectedLanguage === 'tr' ? 'Mesajınız' :
                   selectedLanguage === 'ar' ? 'رسالتك' :
                   selectedLanguage === 'ru' ? 'Ваше сообщение' :
                   'Your Message'}
                </Text>
                <TextInput
                  style={[modalStyles.supportTextArea, theme === 'light' && modalStyles.supportInputLight]}
                  placeholder={selectedLanguage === 'tr' ? 'Lütfen sorununuzu veya önerinizi açıklayın...' :
                              selectedLanguage === 'ar' ? 'يرجى وصف مشكلتك أو اقتراحك...' :
                              selectedLanguage === 'ru' ? 'Пожалуйста, опишите вашу проблему или предложение...' :
                              'Please describe your issue or suggestion...'}
                  placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  value={supportMessage}
                  onChangeText={setSupportMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* Send Email Button */}
              <TouchableOpacity 
                style={[modalStyles.supportButton, theme === 'light' && modalStyles.supportButtonLight, 
                       (!supportEmail || !supportMessage) && modalStyles.supportButtonDisabled]}
                onPress={async () => {
                  if (!supportEmail || !supportMessage) {
                    Alert.alert(
                      selectedLanguage === 'tr' ? 'Eksik Bilgi' : 
                      selectedLanguage === 'ar' ? 'معلومات ناقصة' :
                      selectedLanguage === 'ru' ? 'Недостающая информация' :
                      'Missing Information',
                      selectedLanguage === 'tr' ? 'Lütfen e-posta adresinizi ve mesajınızı girin.' :
                      selectedLanguage === 'ar' ? 'يرجى إدخال عنوان بريدك الإلكتروني ورسالتك.' :
                      selectedLanguage === 'ru' ? 'Пожалуйста, введите ваш email и сообщение.' :
                      'Please enter your email and message.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }

                  try {
                    // Create mailto URL with proper encoding and better format
                    const subject = encodeURIComponent('Kspeaker Support - Kullanıcı Talebi');
                    const body = encodeURIComponent(
                      `Merhaba Kspeaker Destek Ekibi,\n\n` +
                      `===========================================\n` +
                      `KULLANICI BİLGİLERİ:\n` +
                      `===========================================\n` +
                      `Gönderen Email: ${supportEmail}\n` +
                      `Tarih: ${new Date().toLocaleString('tr-TR')}\n\n` +
                      `===========================================\n` +
                      `MESAJ:\n` +
                      `===========================================\n` +
                      `${supportMessage}\n\n` +
                      `-------------------------------------------\n` +
                      `Bu mesaj Kspeaker mobil uygulamasından gönderilmiştir.\n` +
                      `Lütfen kullanıcıya ${supportEmail} adresinden yanıt verin.`
                    );
                    const mailtoUrl = `mailto:omer.yilmaz@kartezya.com?subject=${subject}&body=${body}`;
                    
                    // Check if URL can be opened
                    const canOpen = await Linking.canOpenURL(mailtoUrl);
                    
                    if (canOpen) {
                      await Linking.openURL(mailtoUrl);
                      
                      // Don't clear form immediately - wait for user confirmation
                      Alert.alert(
                        selectedLanguage === 'tr' ? '✉️ Gmail Açıldı!' :
                        selectedLanguage === 'ar' ? '✉️ تم فتح Gmail!' :
                        selectedLanguage === 'ru' ? '✉️ Gmail Открыт!' :
                        '✉️ Gmail Opened!',
                        selectedLanguage === 'tr' ? 
                          '1️⃣ Gmail uygulamanızda MESAJI KONTROL EDİN\n\n' +
                          '2️⃣ Mesaj doğruysa SAĞ ÜSTTEKİ GÖNDER (✈️) BUTONUNA BASIN\n\n' +
                          '3️⃣ Mesaj gönderildiğinde bu formu kapatabilirsiniz\n\n' +
                          '⚠️ ÖNEMLİ: Gönder butonuna basmadan geri gelirseniz mesajınız gönderilemez!' :
                        selectedLanguage === 'ar' ? 
                          '1️⃣ تحقق من الرسالة في تطبيق Gmail\n\n' +
                          '2️⃣ إذا كانت الرسالة صحيحة، اضغط على زر الإرسال (✈️) في الأعلى\n\n' +
                          '3️⃣ بعد إرسال الرسالة، يمكنك إغلاق هذا النموذج\n\n' +
                          '⚠️ مهم: إذا عدت دون الضغط على إرسال، لن يتم إرسال رسالتك!' :
                        selectedLanguage === 'ru' ? 
                          '1️⃣ Проверьте сообщение в приложении Gmail\n\n' +
                          '2️⃣ Если сообщение правильное, нажмите кнопку ОТПРАВИТЬ (✈️) вверху\n\n' +
                          '3️⃣ После отправки сообщения можете закрыть эту форму\n\n' +
                          '⚠️ ВАЖНО: Если вы вернетесь без нажатия отправить, ваше сообщение не будет отправлено!' :
                          '1️⃣ CHECK the message in your Gmail app\n\n' +
                          '2️⃣ If the message is correct, PRESS the SEND (✈️) button at the top right\n\n' +
                          '3️⃣ After sending, you can close this form\n\n' +
                          '⚠️ IMPORTANT: If you return without pressing send, your message will NOT be sent!',
                        [
                          { 
                            text: selectedLanguage === 'tr' ? 'Gönderdim ✅' :
                                  selectedLanguage === 'ar' ? 'أرسلت ✅' :
                                  selectedLanguage === 'ru' ? 'Отправил ✅' :
                                  'Sent ✅',
                            onPress: () => {
                              // Clear form after user confirms
                              setSupportEmail('');
                              setSupportMessage('');
                              onCloseSupport();
                              Alert.alert(
                                selectedLanguage === 'tr' ? '🎉 Teşekkürler!' :
                                selectedLanguage === 'ar' ? '🎉 شكراً!' :
                                selectedLanguage === 'ru' ? '🎉 Спасибо!' :
                                '🎉 Thank You!',
                                selectedLanguage === 'tr' ? '24-48 saat içinde size dönüş yapacağız.' :
                                selectedLanguage === 'ar' ? 'سنرد عليك في غضون 24-48 ساعة.' :
                                selectedLanguage === 'ru' ? 'Мы ответим вам в течение 24-48 часов.' :
                                'We will respond within 24-48 hours.'
                              );
                            }
                          },
                          { 
                            text: selectedLanguage === 'tr' ? 'Henüz Göndermedim' :
                                  selectedLanguage === 'ar' ? 'لم أرسل بعد' :
                                  selectedLanguage === 'ru' ? 'Еще не отправил' :
                                  'Not Yet',
                            style: 'cancel'
                          }
                        ]
                      );
                    } else {
                      throw new Error('Cannot open email app');
                    }
                  } catch (error) {
                    console.error('Error opening email:', error);
                    // Copy email to clipboard as fallback
                    Alert.alert(
                      selectedLanguage === 'tr' ? 'E-posta Uygulaması Bulunamadı' :
                      selectedLanguage === 'ar' ? 'لم يتم العثور على تطبيق البريد الإلكتروني' :
                      selectedLanguage === 'ru' ? 'Почтовое приложение не найдено' :
                      'Email App Not Found',
                      selectedLanguage === 'tr' ? `Cihazınızda e-posta uygulaması yüklü değil.\n\nLütfen omer.yilmaz@kartezya.com adresine manuel olarak yazın:\n\nKonu: Kspeaker Support Request\n\nFrom: ${supportEmail}\n\n${supportMessage}` :
                      selectedLanguage === 'ar' ? `لا يوجد تطبيق بريد إلكتروني على جهازك.\n\nيرجى الكتابة يدويًا إلى omer.yilmaz@kartezya.com:\n\nالموضوع: Kspeaker Support Request\n\nFrom: ${supportEmail}\n\n${supportMessage}` :
                      selectedLanguage === 'ru' ? `На вашем устройстве нет почтового приложения.\n\nПожалуйста, напишите вручную на omer.yilmaz@kartezya.com:\n\nТема: Kspeaker Support Request\n\nFrom: ${supportEmail}\n\n${supportMessage}` :
                      `No email app found on your device.\n\nPlease write manually to omer.yilmaz@kartezya.com:\n\nSubject: Kspeaker Support Request\n\nFrom: ${supportEmail}\n\n${supportMessage}`,
                      [
                        { 
                          text: 'OK',
                          onPress: () => {
                            // Keep form data for manual sending
                          }
                        }
                      ]
                    );
                  }
                }}
              >
                <Ionicons name="send" size={24} color="#FFFFFF" />
                <Text style={modalStyles.supportButtonText}>
                  {selectedLanguage === 'tr' ? 'Mesaj Gönder' :
                   selectedLanguage === 'ar' ? 'إرسال رسالة' :
                   selectedLanguage === 'ru' ? 'Отправить сообщение' :
                   'Send Message'}
                </Text>
              </TouchableOpacity>

              <View style={modalStyles.supportDivider} />
              
              <View style={modalStyles.supportSection}>
                <Text style={[modalStyles.supportInfoText, theme === 'light' && modalStyles.supportTextLight]}>
                  {selectedLanguage === 'tr' ? '📧 E-posta: omer.yilmaz@kartezya.com' :
                   selectedLanguage === 'ar' ? '📧 البريد الإلكتروني: omer.yilmaz@kartezya.com' :
                   selectedLanguage === 'ru' ? '📧 Email: omer.yilmaz@kartezya.com' :
                   '📧 Email: omer.yilmaz@kartezya.com'}
                </Text>
                <Text style={[modalStyles.supportInfoText, theme === 'light' && modalStyles.supportTextLight]}>
                  {selectedLanguage === 'tr' ? '⏰ Yanıt süresi: 24-48 saat' :
                   selectedLanguage === 'ar' ? '⏰ وقت الاستجابة: 24-48 ساعة' :
                   selectedLanguage === 'ru' ? '⏰ Время ответа: 24-48 часов' :
                   '⏰ Response time: 24-48 hours'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Voucher Modal */}
      {showVoucher && (
        <View style={modalStyles.modalOverlay}>
          <View style={[modalStyles.modalContent, theme === 'light' && modalStyles.modalContentLight]}>
            <View style={[modalStyles.modalHeader, theme === 'light' && modalStyles.modalHeaderLight]}>
              <Text style={[modalStyles.modalTitle, theme === 'light' && modalStyles.modalTitleLight]}>{t('addVoucher')}</Text>
              <TouchableOpacity onPress={() => onCloseVoucher()}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={modalStyles.modalBody}>
              <View style={modalStyles.voucherSection}>
                <Ionicons name="ticket" size={64} color="#7DD3C0" style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Text style={[modalStyles.voucherTitle, theme === 'light' && modalStyles.voucherTitleLight]}>
                  {selectedLanguage === 'tr' ? 'Premium Erişim' :
                   selectedLanguage === 'ar' ? 'الوصول المميز' :
                   selectedLanguage === 'ru' ? 'Премиум доступ' :
                   'Premium Access'}
                </Text>
                <Text style={[modalStyles.voucherText, theme === 'light' && modalStyles.voucherTextLight]}>
                  {selectedLanguage === 'tr' ? 'Kupon kodunuzu girerek premium özelliklere erişim sağlayın. Sınırsız konuşma, gelişmiş AI modelleri ve daha fazlası!' :
                   selectedLanguage === 'ar' ? 'أدخل رمز القسيمة للوصول إلى الميزات المميزة. محادثات غير محدودة ونماذج ذكاء اصطناعي متقدمة والمزيد!' :
                   selectedLanguage === 'ru' ? 'Введите код ваучера для доступа к премиум функциям. Неограниченные разговоры, продвинутые AI модели и многое другое!' :
                   'Enter your voucher code to access premium features. Unlimited conversations, advanced AI models, and more!'}
                </Text>
              </View>

              <View style={modalStyles.voucherInputContainer}>
                <TextInput
                  style={[modalStyles.voucherInput, theme === 'light' && modalStyles.voucherInputLight]}
                  placeholder={selectedLanguage === 'tr' ? 'Kupon kodunu girin' :
                              selectedLanguage === 'ar' ? 'أدخل رمز القسيمة' :
                              selectedLanguage === 'ru' ? 'Введите код ваучера' :
                              'Enter voucher code'}
                  placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                  autoCapitalize="characters"
                  maxLength={32}
                  value={voucherInput}
                  onChangeText={setVoucherInput}
                  editable={!voucherSubmitting}
                />
              </View>

              <TouchableOpacity 
                style={[modalStyles.voucherButton, theme === 'light' && modalStyles.voucherButtonLight, voucherSubmitting && modalStyles.supportButtonDisabled]}
                disabled={voucherSubmitting}
                onPress={async () => {
                  const code = voucherInput.trim().toUpperCase();
                  if (!code) {
                    Alert.alert(
                      selectedLanguage === 'tr' ? 'Eksik Bilgi' :
                      selectedLanguage === 'ar' ? 'معلومات ناقصة' :
                      selectedLanguage === 'ru' ? 'Недостающая информация' :
                      'Missing Information',
                      selectedLanguage === 'tr' ? 'Lütfen bir kupon kodu girin.' :
                      selectedLanguage === 'ar' ? 'يرجى إدخال رمز القسيمة.' :
                      selectedLanguage === 'ru' ? 'Пожалуйста, введите код ваучера.' :
                      'Please enter a voucher code.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }

                  setVoucherSubmitting(true);
                  try {
                    const success = await saveRegistration(code);
                    if (success) {
                      setVoucherInput('');
                      onCloseVoucher();
                      Alert.alert(
                        selectedLanguage === 'tr' ? 'Başarılı' :
                        selectedLanguage === 'ar' ? 'نجاح' :
                        selectedLanguage === 'ru' ? 'Успех' :
                        'Success',
                        selectedLanguage === 'tr' ? 'Kupon aktifleştirildi. Premium özellikler açıldı.' :
                        selectedLanguage === 'ar' ? 'تم تفعيل القسيمة. الميزات المميزة متاحة الآن.' :
                        selectedLanguage === 'ru' ? 'Ваучер активирован. Премиум функции открыты.' :
                        'Voucher activated. Premium features unlocked.',
                        [{ text: 'OK' }]
                      );
                    } else {
                      Alert.alert(
                        selectedLanguage === 'tr' ? 'Geçersiz Kupon' :
                        selectedLanguage === 'ar' ? 'قسيمة غير صالحة' :
                        selectedLanguage === 'ru' ? 'Неверный ваучер' :
                        'Invalid Voucher',
                        selectedLanguage === 'tr' ? 'Kupon kodu geçersiz veya kullanılamıyor.' :
                        selectedLanguage === 'ar' ? 'رمز القسيمة غير صالح أو غير متاح.' :
                        selectedLanguage === 'ru' ? 'Код ваучера недействителен или недоступен.' :
                        'Voucher code is invalid or unavailable.',
                        [{ text: 'OK' }]
                      );
                    }
                  } catch (error) {
                    logError(error as Error, 'Voucher activation');
                    Alert.alert('Error', 'Could not activate voucher. Please try again.');
                  } finally {
                    setVoucherSubmitting(false);
                  }
                }}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={modalStyles.voucherButtonText}>
                  {selectedLanguage === 'tr' ? 'Kuponu Aktifleştir' :
                   selectedLanguage === 'ar' ? 'تفعيل القسيمة' :
                   selectedLanguage === 'ru' ? 'Активировать' :
                   'Activate Voucher'}
                </Text>
              </TouchableOpacity>

              <View style={modalStyles.voucherDivider} />

              <View style={modalStyles.voucherSection}>
                <Text style={[modalStyles.voucherInfoTitle, theme === 'light' && modalStyles.voucherInfoTitleLight]}>
                  {selectedLanguage === 'tr' ? '💎 Premium Özellikler' :
                   selectedLanguage === 'ar' ? '💎 الميزات المميزة' :
                   selectedLanguage === 'ru' ? '💎 Премиум функции' :
                   '💎 Premium Features'}
                </Text>
                <View style={modalStyles.voucherFeature}>
                  <Ionicons name="infinite" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.voucherFeatureText, theme === 'light' && modalStyles.voucherFeatureTextLight]}>
                    {selectedLanguage === 'tr' ? 'Sınırsız konuşma' :
                     selectedLanguage === 'ar' ? 'محادثات غير محدودة' :
                     selectedLanguage === 'ru' ? 'Неограниченные разговоры' :
                     'Unlimited conversations'}
                  </Text>
                </View>
                <View style={modalStyles.voucherFeature}>
                  <Ionicons name="trending-up" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.voucherFeatureText, theme === 'light' && modalStyles.voucherFeatureTextLight]}>
                    {selectedLanguage === 'tr' ? 'Gelişmiş AI modelleri' :
                     selectedLanguage === 'ar' ? 'نماذج ذكاء اصطناعي متقدمة' :
                     selectedLanguage === 'ru' ? 'Продвинутые AI модели' :
                     'Advanced AI models'}
                  </Text>
                </View>
                <View style={modalStyles.voucherFeature}>
                  <Ionicons name="flash" size={20} color="#7DD3C0" />
                  <Text style={[modalStyles.voucherFeatureText, theme === 'light' && modalStyles.voucherFeatureTextLight]}>
                    {selectedLanguage === 'tr' ? 'Öncelikli yanıt süresi' :
                     selectedLanguage === 'ar' ? 'وقت استجابة ذو أولوية' :
                     selectedLanguage === 'ru' ? 'Приоритетное время ответа' :
                     'Priority response time'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}


    </>
  );
}
