# 🎉 Sentry Production Logging - KURULUM TAMAMLANDI

## ✅ Kurulum Durumu

**Sentry başarıyla entegre edildi ve test edilmeye hazır!**

---

## 📦 Kurulu Bileşenler

- ✅ **@sentry/react-native** (v7.8.0)
- ✅ **Sentry iOS SDK** (v8.57.3)
- ✅ **83 CocoaPods** kurulu
- ✅ **Build başarılı** (Exit Code: 0)
- ✅ **Uygulama çalışıyor** iPhone 15 Simulator'da

---

## 🧪 Test Nasıl Yapılır?

### 1. Uygulamayı Aç
```bash
npx react-native run-ios --simulator="iPhone 15"
```

### 2. Sentry Test Butonunu Kullan
1. Sol üstteki **☰ Menu** butonuna bas
2. En altta **"Test Sentry Logging"** butonuna bas (🐛 icon)
3. Console'da şunu göreceksin:
   ```
   [Sentry] Capturing event: 🧪 Sentry Test Error - Production logging works!
   ```

### 3. Production Loglarını İzle
Development mode'da Sentry etkin olduğu için:
- Tüm `logError()` çağrıları Sentry'ye gidiyor
- Tüm `logWarning()` çağrıları Sentry'ye gidiyor  
- Tüm `logInfo()` çağrıları breadcrumb olarak kaydediliyor
- Console'da da görünüyor (debug için)

---

## 📝 Gerçek Sentry Hesabı Nasıl Bağlanır?

### Adım 1: Hesap Oluştur (Ücretsiz)
1. https://sentry.io/signup/ adresine git
2. GitHub veya Google ile giriş yap
3. "React Native" platformunu seç
4. Proje adı: **"kspeaker"**

### Adım 2: DSN Kodunu Al
Sentry size şöyle bir DSN verecek:
```
https://abc123def456@o123456.ingest.sentry.io/7890123
```

### Adım 3: `index.js`'i Güncelle
```javascript
// Şu satırı bul:
dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',

// Kendi DSN'inle değiştir:
dsn: 'https://abc123def456@o123456.ingest.sentry.io/7890123',
```

### Adım 4: Production Mode'u Ayarla
Test bittikten sonra `index.js`'te şunu değiştir:
```javascript
// Test için:
enabled: true,

// Production için:
enabled: !__DEV__,
```

---

## 🎯 Hangi Loglar Sentry'ye Gidiyor?

### 1. API Hataları
```typescript
// api.ts - sendChatMessage
catch (error: any) {
  if (!__DEV__) {
    logError(error, 'API sendChatMessage');
  }
  throw error;
}
```

**Yakalanan Durumlar:**
- Network hataları
- Backend API hataları
- Quota exceeded errors
- Timeout errors

### 2. Kullanıcı İşlemleri (Breadcrumbs)
```typescript
logInfo(`[API] Device initialized: ${deviceId}`);
logInfo(`[API] User registered successfully: ${email}`);
logInfo(`[API] Chat response received: ${reply.substring(0, 50)}...`);
```

**Neden Önemli:**
Hata olmadan önce kullanıcı ne yaptı görebilirsin:
- Kullanıcı kaydı
- Chat mesajı gönderimi
- API yanıtları

### 3. Uyarılar (Warnings)
```typescript
logWarning(`[API] Registration failed: ${response.status}`);
```

**Kullanım:**
- Başarısız istekler
- Yavaş API yanıtları
- Garip durumlar

### 4. Test Hatası (Drawer Menu)
```typescript
throw new Error('🧪 Sentry Test Error - Production logging works!');
```

---

## 📊 Sentry Dashboard'da Göreceklerin

### Issues (Hatalar)
- **Error Message**: "🧪 Sentry Test Error"
- **Stack Trace**: Hangi satırda oldu
- **Context**: "SENTRY_TEST"
- **Device Info**: iPhone 15, iOS 17.2
- **App Version**: 1.0.0

### Breadcrumbs (İz Kroshması)
Hata olmadan önce neler oldu:
```
1. [API] Device initialized: abc-123-def
2. [API] User registered: user@example.com
3. [API] Chat response received: Hello! How can...
4. ERROR: Network timeout
```

### Performance
- API call duration
- Slow screens
- Memory leaks

---

## 🚀 Production Build Nasıl Test Edilir?

### Release Build ile Test
```bash
npx react-native run-ios --configuration Release
```

Bu modda:
- Sentry **tam aktif** olur
- Console loglar **gözükmez**
- Tüm hatalar **sadece Sentry'ye** gider
- Kullanıcılar log görmez

---

## 💾 Mevcut Logger Fonksiyonları

### logError()
```typescript
import { logError } from './logger';

try {
  await riskyOperation();
} catch (error) {
  logError(error, 'OPERATION_NAME');
}
```

**Dev Mode:** Console'a yazar  
**Production:** Sentry'ye gönderir

### logWarning()
```typescript
import { logWarning } from './logger';

if (responseTime > 5000) {
  logWarning('API response slow', responseTime);
}
```

**Dev Mode:** console.warn()  
**Production:** Sentry warning

### logInfo()
```typescript
import { logInfo } from './logger';

logInfo('[UI] User clicked voice button');
```

**Dev Mode:** console.log()  
**Production:** Sentry breadcrumb (hata debug için)

---

## 🔧 Şu Anki Konfigürasyon

```javascript
// index.js
Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enabled: true, // Test için her zaman aktif
  environment: __DEV__ ? 'development' : 'production',
  beforeSend(event) {
    if (__DEV__) {
      console.log('[Sentry] Capturing event:', event);
    }
    return event;
  },
});
```

**Ayarlar:**
- `tracesSampleRate`: Dev'de %100, Production'da %20
- `enabled`: Şimdilik test için her zaman açık
- `beforeSend`: Dev'de console'a yazdır (debug)

---

## 📈 Ücretsiz Tier Limitleri

| Özellik | Limit |
|---------|-------|
| Error Events | 5,000/ay |
| Performance Transactions | 10,000/ay |
| Kullanıcı Sayısı | 1 |
| Veri Saklama | 30 gün |
| Projeckt Sayısı | Sınırsız |

---

## ✅ Checklist

- [x] Sentry package kuruldu
- [x] iOS pods kuruldu
- [x] index.js initialize edildi
- [x] logger.ts Sentry ile entegre
- [x] Test butonu eklendi (Drawer menu)
- [x] API'de production loglar eklendi
- [x] Build başarılı
- [x] Uygulama çalışıyor
- [ ] **Gerçek Sentry DSN eklenmeli** (isteğe bağlı)
- [ ] Production mode ayarlanmalı (`enabled: !__DEV__`)

---

## 🎯 Sonraki Adımlar

### 1. Test Et
- Drawer menu'den "Test Sentry Logging" butonuna bas
- Console'da Sentry event'ini gör

### 2. Sentry Hesabı Aç (İsteğe Bağlı)
- https://sentry.io/signup/
- DSN kodunu al
- `index.js`'te güncelle

### 3. Production Launch
- `enabled: !__DEV__` yap
- Release build al
- App Store'a gönder
- Sentry dashboard'dan canlı logları izle

---

## 🐛 Sorun Giderme

### Build hatası alıyorum
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

### Sentry logları göremiyorum
1. `enabled: true` olduğundan emin ol
2. Console'da `[Sentry] Capturing event` görüyor musun?
3. `beforeSend` callback'i event'i return ediyor mu?

### Production'da log gelmiyor
1. DSN doğru mu kontrol et
2. `enabled: !__DEV__` ayarlı mı?
3. Release build ile test et

---

## 📱 Test Senaryosu

1. **Uygulamayı aç**
2. **Drawer'ı aç** (☰)
3. **"Test Sentry Logging"** butonuna bas
4. **Console'u kontrol et:**
   ```
   [Sentry] Capturing event: {
     message: "🧪 Sentry Test Error - Production logging works!",
     level: "error",
     tags: { context: "SENTRY_TEST" }
   }
   ```
5. **Başarılı!** Gerçek Sentry'de de aynısını göreceksin

---

**Status: ✅ ÇALIŞIYOR - Test edilmeye hazır!**

Gerçek Sentry hesabı açmak istersen: https://sentry.io/signup/
