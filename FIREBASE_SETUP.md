# Firebase Crashlytics Kurulum Talimatları

## ✅ Tamamlanan Adımlar
- Firebase paketleri yüklendi
- iOS pods güncellendi
- logger.ts Firebase ile entegre edildi
- index.js'de Crashlytics başlatıldı

## 🔴 Yapılması Gerekenler

### 1. Firebase Console'da Proje Oluştur
1. [Firebase Console](https://console.firebase.google.com/) adresine git
2. "Add project" veya "Proje ekle" tıkla
3. Proje adı: **Kspeaker** (veya istediğin isim)
4. Google Analytics: İsteğe bağlı (önerilir)
5. Projeyi oluştur

### 2. iOS App Ekle
1. Firebase Console'da projenizi açın
2. iOS simgesine tıklayın
3. **iOS bundle ID**: `org.reactjs.native.example.kspeaker`
   - Bunu `ios/kspeaker/Info.plist` dosyasından kontrol edin
4. App nickname: Kspeaker
5. App Store ID: Boş bırak (henüz App Store'da değil)
6. "Register app" tıkla

### 3. GoogleService-Info.plist İndir
1. Firebase Console'da "Download GoogleService-Info.plist" butonuna tıkla
2. İndirilen dosyayı şu konuma taşı:
   ```
   ios/kspeaker/GoogleService-Info.plist
   ```
3. Xcode'da projeyi aç:
   ```bash
   open ios/kspeaker.xcworkspace
   ```
4. Sol panelde `kspeaker` klasörüne sağ tıkla → "Add Files to kspeaker..."
5. `GoogleService-Info.plist` dosyasını seç
6. ✅ "Copy items if needed" işaretle
7. Add butonuna tıkla

### 4. Firebase Console'da Crashlytics'i Aktifleştir
1. Firebase Console → Sol menüden "Crashlytics"
2. "Get started" veya "Başlat" butonuna tıkla
3. Setup talimatlarını takip et (bizde zaten yapıldı)

### 5. İlk Crash Test Et
1. Uygulamayı simulator'de çalıştır:
   ```bash
   npx react-native run-ios
   ```
2. Uygulamada bir hata oluştur (test için)
3. Uygulamayı kapat ve tekrar aç
4. 5-10 dakika bekle
5. Firebase Console → Crashlytics bölümünde crash'leri göreceksin

## 📊 Logları Nasıl Görürsün?

### Production Logları (Kullanıcılar Göremez)
1. **Firebase Console** → [console.firebase.google.com](https://console.firebase.google.com)
2. Sol menüden **Crashlytics** seç
3. Burada göreceksin:
   - ❌ Crash reports (uygulama çökmesi)
   - ⚠️ Non-fatal errors (logError ile gönderilen hatalar)
   - 📝 Custom logs (logInfo ile gönderilen loglar)
   - 👥 Etkilenen kullanıcı sayısı
   - 📱 Cihaz bilgileri
   - 🕐 Zaman bilgileri

### Development Logları (Sadece Geliştirme)
- Xcode Console'da göreceksin (simulator/device çalışırken)
- Terminal'de Metro bundler çıktılarında
- Bu loglar sadece `__DEV__` modunda çalışır

## 🎯 Önemli Notlar

1. **Simulator vs Real Device**:
   - Crashlytics simulator'de tam çalışmaz
   - Gerçek test için fiziksel iOS cihaz gerekir

2. **Gecikme**:
   - Crash'ler Firebase'e 5-10 dakika içinde ulaşır
   - Real-time değil, biraz gecikme olabilir

3. **Privacy**:
   - Kullanıcılar logları görmez
   - Sadece Firebase Console'dan sen görürsün
   - Kişisel veri toplamaz (default ayarlar)

4. **Ücretsiz**:
   - Firebase Crashlytics tamamen ücretsiz
   - Limitsiz crash reports
   - Sınırsız kullanıcı

## 🔧 Sorun Giderme

### GoogleService-Info.plist Bulunamıyor
```
Error: GoogleService-Info.plist not found
```
**Çözüm**: Dosyayı `ios/kspeaker/` klasörüne kopyala ve Xcode'da projeye ekle

### Build Hatası
```
Module 'Firebase' not found
```
**Çözüm**:
```bash
cd ios
pod deintegrate
pod install
```

### Crashlytics Console'da Veri Yok
- En az 5-10 dakika bekle
- Uygulamayı kapat ve tekrar aç (crash gönderimi için gerekli)
- Real device kullan (simulator bazen sorunlu)

## 📱 Şimdi Ne Yapmalısın?

1. ✅ Firebase Console'da proje oluştur
2. ✅ iOS app ekle
3. ✅ GoogleService-Info.plist indir ve projeye ekle
4. ✅ Uygulamayı tekrar build et
5. ✅ Test crash gönder
6. ✅ Firebase Console'da kontrol et

**Tahmini Süre**: 10-15 dakika

Her şey hazır! Sadece Firebase Console'dan GoogleService-Info.plist dosyasını alıp projeye eklemelisin. 🚀
