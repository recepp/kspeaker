# App Store Connect — App Review Notes
## COPY THIS ENTIRE TEXT INTO THE "NOTES" FIELD IN APP STORE CONNECT

---

## 1. APP PURPOSE & VALUE

**Kspeaker** is an AI-powered English speaking practice app designed for non-native English speakers who want to improve their conversational fluency. The app solves the problem of lacking a safe, always-available, judgment-free English conversation partner.

**How it works:**
- The user taps a microphone button → speaks in English → the app transcribes the speech using Apple's on-device Speech Recognition → sends the text to Google Gemini AI → receives a natural English response → reads it aloud via Apple TTS.
- Users can also type messages in a chat interface.
- No login or account creation is required to use the app.

**Value provided:**
- Real-time English conversation practice with an AI tutor
- Multiple teaching modes (Teacher, Beginner, Business, Casual, Roleplay)
- English vocabulary flashcards (Flash Cards screen)
- English level quiz (Beginner / Intermediate / Advanced)
- Daily practice reminder notifications
- Interface available in 4 languages: English, Turkish, Arabic, Russian

---

## 2. HOW TO ACCESS & TEST ALL FEATURES

**No account or login is required.** The app auto-registers an anonymous device ID on first launch.

**Step-by-step test flow:**

1. **Launch app** → Main chat screen appears immediately (no login screen)
2. **Text chat** → Type any English sentence in the text box → tap Send → AI responds
3. **Voice conversation** → Tap the microphone icon (bottom right) → grant microphone permission when prompted → speak in English → app listens, transcribes, sends to AI, and speaks the reply aloud
4. **Change AI mode** → Tap the **+** (plus) button → select "Mode" → choose from: Conversation, Teacher, Beginner, Casual Friend, Strict, Roleplay, Business
5. **English Quiz** → Tap **+** button → "English Quiz" → select difficulty → answer 5 questions
6. **Flash Cards** → Tap the hamburger menu (top left) → "Flash Cards" → select a vocabulary level
7. **Delete Account** → Tap hamburger menu → "Delete Account" → confirm deletion → all local data is cleared
8. **Settings** → Hamburger menu → "Settings" → toggle daily notifications, change theme, change language
9. **Language switch** → Hamburger menu → "Language" → select EN / TR / AR / RU
10. **Microphone permission prompt** → Occurs on first voice conversation attempt

**No demo account credentials are needed.** The app has no login system.

---

## 3. EXTERNAL SERVICES & PLATFORMS

| Service | Purpose | Data Sent |
|---|---|---|
| **Google Gemini AI** (Google LLC) | AI conversation responses — the core AI tutor | User's transcribed text messages, conversation session context |
| **Apple Speech Recognition** | On-device voice-to-text transcription | Microphone audio (processed locally on device) |
| **Apple Text-to-Speech (TTS)** | Reading AI responses aloud | Text strings only |
| **Apple Push Notification Service (APNs)** | Daily English practice reminders | Device push token (only if user enables notifications) |
| **Firebase Analytics** (Google LLC) | Anonymous usage analytics | Anonymous device ID, session events |
| **Firebase Cloud Messaging** | Push notification delivery | Device push token |

No payment processor is used. The app does not process any financial transactions. Voucher codes are validated client-side only.

Privacy policies:
- Google: https://policies.google.com/privacy
- Apple: https://www.apple.com/legal/privacy/

---

## 4. MICROPHONE & SPEECH RECOGNITION USAGE

- **Microphone** is used ONLY when the user explicitly taps the microphone button to start a voice conversation. It is never accessed in the background.
- **Speech Recognition** transcribes the user's spoken English to text locally using Apple's framework. The resulting text (not the audio) is sent to Google Gemini AI.
- Audio recordings are NOT stored on our servers. They are processed in real-time and discarded.

---

## 5. ACCOUNT DELETION

The app includes a full account deletion flow accessible from:
**Hamburger Menu → "Delete Account"**

Tapping "Delete Account" and confirming will:
- Clear the anonymous device registration (`AsyncStorage` data)
- Clear all local conversation history
- Clear all app settings and preferences

This satisfies Apple's account deletion requirement (App Store Review Guideline 5.1.1(v)).

---

## 6. REGIONAL DIFFERENCES

**The app functions consistently across all regions worldwide.**

- No features are restricted by geographic region
- No region-specific content
- No VPN or location detection
- Interface language can be changed manually by the user (EN/TR/AR/RU) — it does NOT auto-detect by region
- All AI responses are in English regardless of region

---

## 7. REGULATED INDUSTRY

This app is an **educational / language learning** application. It does not operate in a regulated industry (no healthcare, finance, legal, or children's data collection). No special credentials or authorizations are required.

Age rating: **4+** — No objectionable content. No user-generated public content. No social networking features.

---

## 8. PRIVACY POLICY, TERMS & SUPPORT URLS

- **Privacy Policy:** https://recepp.github.io/kspeaker/privacy.html
- **Terms of Service:** https://recepp.github.io/kspeaker/terms.html
- **Support:** https://recepp.github.io/kspeaker/support.html
- **Support Email:** omer.yilmaz@kartezya.com

---

## 9. SCREEN RECORDING NOTES

The screen recording (uploaded separately) demonstrates:
1. App launch → main chat screen
2. Typing a message → AI response
3. Tapping microphone → microphone permission prompt → voice conversation
4. Opening the + menu → selecting AI mode
5. Opening hamburger menu → Flash Cards navigation
6. Opening hamburger menu → Delete Account → confirmation flow
7. Settings → notification toggle → language change

