# Sentry Setup Guide for Kspeaker

## ✅ Installation Complete

Sentry is now installed and configured in your React Native app.

## 📝 Next Steps

### 1. Create Sentry Account (Free)

1. Go to https://sentry.io/signup/
2. Sign up with GitHub or Google
3. Select "React Native" as your platform
4. Create a new project named "kspeaker"

### 2. Get Your DSN

After creating the project, Sentry will show you a DSN (Data Source Name) that looks like:
```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

### 3. Update index.js with Your DSN

Replace this line in `index.js`:
```javascript
dsn: 'https://YOUR_DSN_HERE@sentry.io/YOUR_PROJECT_ID',
```

With your actual DSN:
```javascript
dsn: 'https://abc123def456@o123456.ingest.sentry.io/7890123',
```

## 🧪 Test Sentry

Add this test button to your ChatScreen.tsx to test error reporting:

```typescript
<TouchableOpacity 
  onPress={() => {
    throw new Error('Test Sentry Error!');
  }}
  style={{padding: 10, backgroundColor: 'red'}}>
  <Text style={{color: 'white'}}>Test Sentry</Text>
</TouchableOpacity>
```

Build the app in **Release mode** to test production logging:
```bash
npx react-native run-ios --configuration Release
```

## 📊 Sentry Dashboard Features

After setup, you'll see in Sentry dashboard:

### Issues
- All errors with stack traces
- How many times each error occurred
- Which users/devices affected

### Performance
- API call response times
- Screen load times
- Slow operations

### Breadcrumbs
- User actions before crash
- logInfo() calls showing app flow
- Network requests

### Releases
- Track errors by version
- See which version has most issues
- Compare stability across versions

## 🎯 Current Configuration

**Environment:**
- Development: Sentry disabled (uses console.log)
- Production: Sentry enabled
  - tracesSampleRate: 0.2 (20% of transactions)
  - All errors captured
  - All warnings captured
  - Breadcrumbs for logInfo

**Free Tier Limits:**
- 5,000 error events/month
- 10,000 performance transactions/month
- 1 user
- 30 days data retention

## 🔧 Logging Functions

### logError
```typescript
import { logError } from './logger';

try {
  // risky code
} catch (error) {
  logError(error, 'API_CALL');
}
```
- Dev: console.error
- Production: Sent to Sentry with context tag

### logWarning
```typescript
import { logWarning } from './logger';

logWarning('API response slow', response.time);
```
- Dev: console.warn
- Production: Sent to Sentry as warning

### logInfo
```typescript
import { logInfo } from './logger';

logInfo('User started voice recording');
```
- Dev: console.log
- Production: Added as breadcrumb (helps debug crashes)

## 🚀 Production Build

To test Sentry in production mode:

```bash
# iOS
npx react-native run-ios --configuration Release

# Build for App Store
cd ios
xcodebuild -workspace kspeaker.xcworkspace -scheme kspeaker -configuration Release
```

## ✅ What's Configured

- ✅ @sentry/react-native installed (v7.8.0)
- ✅ iOS pods installed (Sentry 8.57.3)
- ✅ index.js initialized with Sentry
- ✅ logger.ts integrated with Sentry
- ✅ Dev mode: console only
- ✅ Production mode: Sentry enabled
- ⏳ Pending: Add your DSN

## 🔗 Useful Links

- Sentry Dashboard: https://sentry.io/
- React Native Docs: https://docs.sentry.io/platforms/react-native/
- Performance Monitoring: https://docs.sentry.io/platforms/react-native/performance/

---

**Status:** Ready to use after adding DSN
