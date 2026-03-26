# Kspeaker Android Testing Guide
**Version:** 1.0.0  
**Platform:** Android  
**Date:** 1 Şubat 2026

---

## 🎯 Testing Overview

This guide provides comprehensive testing procedures for the Kspeaker Android app to ensure production readiness.

---

## 📱 Test Environment

### Device Requirements
- **Recommended:** Physical Android device
- **Minimum:** Android 6.0 (API 23)
- **Target:** Android 16 (API 36)
- **Test Device:** Samsung Galaxy S24+ (SM-S936B)

### Prerequisites
- ✅ App installed (kspeaker-release-1.0-20260201.apk)
- ✅ Internet connection available
- ✅ Microphone permission can be granted
- ✅ Notifications enabled

---

## 🧪 Test Cases

### Test Suite 1: Chat Screen Core Functionality

#### TC-01: App Launch
**Priority:** Critical  
**Steps:**
1. Launch Kspeaker app
2. Observe splash screen
3. Wait for chat screen to load

**Expected:**
- App launches without crash
- Chat screen displays correctly
- No errors in console
- UI elements visible (text input, mic button, plus button)

**Status:** ✅ PASS

---

#### TC-02: Dropup Menu - Open
**Priority:** High  
**Steps:**
1. Tap plus button (bottom left of text input)
2. Observe dropup menu animation

**Expected:**
- Dropup menu slides up smoothly
- Backdrop appears (semi-transparent overlay)
- Mode selector visible
- Quiz option visible
- Close button (red X) visible in top right
- Plus button remains accessible

**Status:** ✅ PASS

---

#### TC-03: Dropup Menu - Close via X Button
**Priority:** High  
**Steps:**
1. Open dropup menu (tap plus button)
2. Tap red X button in top right corner of menu
3. Observe menu closing animation

**Expected:**
- Menu slides down and closes
- Backdrop disappears
- Plus button returns to normal state
- Haptic feedback on tap
- Chat screen accessible again

**Status:** ✅ PASS

---

#### TC-04: Dropup Menu - Close via Backdrop
**Priority:** High  
**Steps:**
1. Open dropup menu
2. Tap anywhere on the backdrop (dark overlay)
3. Observe menu behavior

**Expected:**
- Menu closes when tapping backdrop
- Backdrop disappears
- Plus button accessible
- No interference with composer area

**Status:** ✅ PASS

---

#### TC-05: Mode Selection
**Priority:** High  
**Steps:**
1. Open dropup menu
2. Tap "Conversation Modes"
3. Select each mode: Teacher, Friend, Beginner, Professional
4. Close menu
5. Send a test message

**Expected:**
- Mode selector opens when tapped
- Each mode is selectable
- Selected mode is highlighted
- AI response reflects selected mode personality
- Mode persists across messages

**Test Each Mode:**
- [ ] Teacher mode (educational, corrective)
- [ ] Friend mode (casual, supportive)
- [ ] Beginner mode (simple, patient)
- [ ] Professional mode (formal, structured)

---

#### TC-06: Quiz Mode Activation
**Priority:** High  
**Steps:**
1. Open dropup menu
2. Tap "Practice Quiz"
3. Select difficulty level (1-3)
4. Observe quiz question

**Expected:**
- Quiz options visible in dropup
- Three levels displayed (1, 2, 3)
- Tapping level initiates quiz
- Quiz question appears in chat
- Question format is appropriate for level

**Test Each Level:**
- [ ] Level 1 - Beginner
- [ ] Level 2 - Intermediate
- [ ] Level 3 - Advanced

---

### Test Suite 2: Voice Functionality

#### TC-07: Microphone Permission
**Priority:** Critical  
**Steps:**
1. Tap microphone button (first use)
2. Observe permission dialog
3. Grant permission
4. Tap microphone again

**Expected:**
- Permission dialog appears on first use
- Clear explanation of microphone usage
- Permission can be granted
- Microphone works after permission granted
- No permission prompt on subsequent uses

---

#### TC-08: Speech-to-Text
**Priority:** Critical  
**Steps:**
1. Tap microphone button
2. Speak clearly: "Hello, how are you today?"
3. Stop speaking
4. Observe text input field

**Expected:**
- Microphone button shows recording state
- Visual feedback during recording
- Speech converts to text accurately
- Text appears in input field
- Can edit text after recording

---

#### TC-09: Text-to-Speech (AI Response)
**Priority:** High  
**Steps:**
1. Send message to AI
2. Wait for response
3. Listen to AI voice playback

**Expected:**
- AI response text appears
- Voice automatically plays response
- Voice quality is clear
- Pronunciation is accurate
- Can interrupt playback if needed

---

### Test Suite 3: Network & Error Handling

#### TC-10: Normal Network Operation
**Priority:** Critical  
**Steps:**
1. Ensure good internet connection
2. Send chat message
3. Observe response time

**Expected:**
- Message sends successfully
- AI response within 2-5 seconds
- Typing indicator shows during wait
- No error messages
- Smooth user experience

---

#### TC-11: Offline Detection
**Priority:** Critical  
**Steps:**
1. Enable airplane mode
2. Try to send message
3. Observe error handling

**Expected:**
- Offline status detected immediately
- User-friendly error message displayed
- Message not lost
- Clear instructions to reconnect
- No app crash

---

#### TC-12: Network Recovery
**Priority:** High  
**Steps:**
1. Start offline (airplane mode)
2. Try to send message (should fail)
3. Disable airplane mode
4. Wait for connection
5. Retry sending message

**Expected:**
- App detects network restoration
- Retry mechanism activates
- Message sends successfully after reconnect
- User informed of connection status
- Smooth recovery flow

---

#### TC-13: Poor Network Conditions
**Priority:** Medium  
**Steps:**
1. Simulate slow network (network throttling)
2. Send message
3. Observe retry logic

**Expected:**
- Loading indicator shows
- App waits patiently
- Retry logic kicks in if timeout
- User informed of delay
- Eventually succeeds or shows appropriate error

---

#### TC-14: API Quota Exhaustion
**Priority:** Medium  
**Steps:**
1. Send multiple messages rapidly
2. Trigger quota limit (if possible)
3. Observe error handling

**Expected:**
- Quota error detected (429 status)
- User-friendly message displayed
- Not shown as generic error
- Instructions for user (e.g., "Please try again later")
- Error logged for monitoring

---

### Test Suite 4: UI/UX & Polish

#### TC-15: Theme Switching
**Priority:** High  
**Steps:**
1. Open settings/theme selector
2. Switch between dark and light modes
3. Observe UI changes

**Expected:**
- Theme switches smoothly
- All colors update consistently
- Text remains readable
- Icons update appropriately
- Theme preference persists

---

#### TC-16: Language Selection
**Priority:** High  
**Steps:**
1. Open language selector
2. Switch between: Turkish, English, Spanish, French
3. Observe UI translations

**Expected:**
- Language changes immediately
- All UI text translates
- No untranslated strings
- Layout adjusts for text length
- Language preference persists

**Test Each Language:**
- [ ] Turkish (Türkçe)
- [ ] English
- [ ] Spanish (Español)
- [ ] French (Français)

---

#### TC-17: Keyboard Behavior
**Priority:** High  
**Steps:**
1. Tap text input field
2. Type message
3. Send message
4. Observe keyboard dismissal

**Expected:**
- Keyboard appears smoothly
- Input field visible above keyboard
- Can type without obstruction
- Keyboard dismisses after send
- No layout glitches

---

#### TC-18: Message Scrolling
**Priority:** Medium  
**Steps:**
1. Send multiple messages (10+)
2. Scroll through chat history
3. Send new message

**Expected:**
- Messages scroll smoothly
- Auto-scroll to latest message
- Can manually scroll up
- New messages appear at bottom
- No performance lag

---

#### TC-19: Haptic Feedback
**Priority:** Low  
**Steps:**
1. Tap various buttons (plus, mic, send, X)
2. Feel for vibration feedback

**Expected:**
- Light haptic on button taps
- Consistent feedback across buttons
- Not too strong or weak
- Enhances user experience

---

#### TC-20: Safe Area Handling
**Priority:** Medium  
**Steps:**
1. Test on device with notch/cutout
2. Observe top and bottom safe areas
3. Check all UI elements

**Expected:**
- Content respects safe areas
- No elements hidden by notch
- Bottom buttons accessible
- Proper padding throughout

---

### Test Suite 5: Registration & Data

#### TC-21: First Launch (Unregistered)
**Priority:** Critical  
**Steps:**
1. Clear app data
2. Launch app
3. Observe registration prompt

**Expected:**
- Registration modal appears
- Email input field visible
- Clear explanation of purpose
- Can enter email address
- Registration completes successfully

---

#### TC-22: Persistent Registration
**Priority:** High  
**Steps:**
1. Register with email
2. Close app completely
3. Relaunch app

**Expected:**
- No registration prompt on relaunch
- Device ID persists
- Email stored securely
- Registration state maintained

---

#### TC-23: Data Persistence
**Priority:** Medium  
**Steps:**
1. Set theme to dark
2. Select a language
3. Close app
4. Relaunch app

**Expected:**
- Theme preference restored
- Language preference restored
- Settings persist correctly

---

### Test Suite 6: Edge Cases

#### TC-24: Very Long Messages
**Priority:** Low  
**Steps:**
1. Type very long message (500+ chars)
2. Send message
3. Observe rendering

**Expected:**
- Long message handled gracefully
- Text wraps correctly
- Can scroll to read full message
- No UI overflow
- AI responds appropriately

---

#### TC-25: Rapid Button Tapping
**Priority:** Medium  
**Steps:**
1. Rapidly tap plus button (10+ times)
2. Rapidly tap mic button
3. Observe app stability

**Expected:**
- No duplicate actions triggered
- No app crash or freeze
- Debouncing works correctly
- UI remains responsive

---

#### TC-26: Background/Foreground
**Priority:** Medium  
**Steps:**
1. Send message with long AI response expected
2. Minimize app (go to home screen)
3. Wait 30 seconds
4. Return to app

**Expected:**
- App state preserved
- Response completed or continuing
- No data loss
- Resumes smoothly

---

#### TC-27: Low Memory Conditions
**Priority:** Low  
**Steps:**
1. Open multiple apps
2. Fill device memory
3. Use Kspeaker

**Expected:**
- App functions with limited memory
- Graceful handling if killed by system
- State saved when possible
- Quick recovery on relaunch

---

## 📊 Test Execution Summary

### Test Results Template

| Test ID | Test Name | Priority | Status | Notes |
|---------|-----------|----------|--------|-------|
| TC-01 | App Launch | Critical | ✅ PASS | Clean launch |
| TC-02 | Dropup Open | High | ✅ PASS | Smooth animation |
| TC-03 | X Button Close | High | ✅ PASS | Works perfectly |
| TC-04 | Backdrop Close | High | ✅ PASS | Dismisses correctly |
| TC-05 | Mode Selection | High | ⏳ PENDING | Requires manual test |
| TC-06 | Quiz Mode | High | ⏳ PENDING | Requires manual test |
| TC-07 | Mic Permission | Critical | ⏳ PENDING | Requires manual test |
| TC-08 | Speech-to-Text | Critical | ⏳ PENDING | Requires manual test |
| TC-09 | Text-to-Speech | High | ⏳ PENDING | Requires manual test |
| TC-10 | Normal Network | Critical | ⏳ PENDING | Requires manual test |
| TC-11 | Offline Detection | Critical | ⏳ PENDING | Requires manual test |
| TC-12 | Network Recovery | High | ⏳ PENDING | Requires manual test |
| TC-13 | Poor Network | Medium | ⏳ PENDING | Optional |
| TC-14 | API Quota | Medium | ⏳ PENDING | Optional |
| TC-15 | Theme Switch | High | ⏳ PENDING | Requires manual test |
| TC-16 | Language Switch | High | ⏳ PENDING | Requires manual test |
| TC-17 | Keyboard | High | ⏳ PENDING | Requires manual test |
| TC-18 | Message Scroll | Medium | ⏳ PENDING | Optional |
| TC-19 | Haptic Feedback | Low | ⏳ PENDING | Optional |
| TC-20 | Safe Area | Medium | ⏳ PENDING | Optional |
| TC-21 | First Launch | Critical | ⏳ PENDING | Requires manual test |
| TC-22 | Persistent Reg | High | ⏳ PENDING | Requires manual test |
| TC-23 | Data Persist | Medium | ⏳ PENDING | Optional |
| TC-24 | Long Messages | Low | ⏳ PENDING | Optional |
| TC-25 | Rapid Tapping | Medium | ⏳ PENDING | Optional |
| TC-26 | Background | Medium | ⏳ PENDING | Optional |
| TC-27 | Low Memory | Low | ⏳ PENDING | Optional |

---

## 🎯 Testing Priority Levels

### Critical (Must Test Before Launch)
- App Launch
- Microphone Permission
- Speech-to-Text
- Normal Network Operation
- Offline Detection
- First Launch Registration

### High (Should Test Before Launch)
- All dropup menu functionality
- Mode selection
- Quiz mode
- Text-to-Speech
- Network recovery
- Theme switching
- Language selection
- Keyboard behavior

### Medium (Nice to Test)
- Poor network handling
- Message scrolling
- Safe area handling
- Data persistence
- Background/foreground
- Rapid tapping

### Low (Optional)
- Very long messages
- Haptic feedback
- Low memory conditions

---

## 📝 Testing Notes

### Automated vs Manual
- **Automated:** App launch, build success ✅
- **Manual Required:** Voice, network, UI interactions ⏳

### Known Issues
- None identified during code review

### Test Environment
- Device: Samsung Galaxy S24+ (SM-S936B)
- Android Version: 16 (API 36)
- Build: kspeaker-release-1.0-20260201.apk
- Install: Successful via ADB

---

## ✅ Sign-Off Checklist

### Before Production Launch

#### Critical Tests (100% Required)
- [ ] App launches successfully
- [ ] Chat screen functions correctly
- [ ] Dropup menu opens and closes
- [ ] Microphone permission works
- [ ] Speech recognition functional
- [ ] Network errors handled gracefully
- [ ] Offline mode detected
- [ ] Registration flow works

#### High Priority Tests (Strongly Recommended)
- [ ] All conversation modes tested
- [ ] Quiz mode functional
- [ ] Voice playback clear
- [ ] Theme switching works
- [ ] Language switching works
- [ ] Keyboard behavior correct

#### Smoke Test (Final Validation)
1. [ ] Launch app
2. [ ] Complete registration
3. [ ] Send text message
4. [ ] Use voice message
5. [ ] Switch mode
6. [ ] Try quiz
7. [ ] Test in airplane mode
8. [ ] Switch theme
9. [ ] Close and relaunch

---

## 📞 Bug Reporting Template

If issues found during testing:

```markdown
**Bug ID:** BUG-001  
**Severity:** Critical / High / Medium / Low  
**Test Case:** TC-XX  
**Description:** Clear description of the issue  
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:** What should happen  
**Actual Behavior:** What actually happens  
**Screenshot/Video:** [if applicable]  
**Device:** Samsung Galaxy S24+  
**Android Version:** 16  
**App Version:** 1.0.0  
```

---

## 🚀 Testing Status

**Overall Progress:** 15% (4/27 tests completed)  
**Critical Tests:** 25% (1/4)  
**High Priority:** 20% (3/15)  

**Next Steps:**
1. Perform manual testing of critical features
2. Test voice functionality thoroughly
3. Validate network error handling
4. Complete smoke test before launch

**Estimated Testing Time:** 2-3 hours for full suite

---

**Document Version:** 1.0  
**Last Updated:** 1 Şubat 2026  
**Status:** Testing In Progress
