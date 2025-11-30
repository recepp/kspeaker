# iOS Premium Voice Setup Guide

## Problem
iOS TTS varsayılan olarak düşük kaliteli, robotik sesler kullanır. Premium neural sesler cihazda yüklü DEĞİLDİR.

## Çözüm: Premium Sesleri İndir

### iPhone'unda Yapman Gerekenler:

1. **Ayarlar** uygulamasını aç
2. **Erişilebilirlik** (Accessibility) → **Konuşulan İçerik** (Spoken Content)
3. **Sesler** (Voices) → **İngilizce (ABD)** seç
4. Aşağıdaki **Enhanced Quality** seslerden birini indir:

### En İyi Sesler (GPT Benzeri):

#### 🥇 En İyi Seçenekler:
- **Samantha (Enhanced)** ⭐ - En doğal, konuşma tarzı kadın sesi
  - Boyut: ~200-300 MB
  - Kalite: En yüksek
  - Ton: Sıcak, doğal, konuşkan
  
- **Ava (Premium)** ⭐ - Modern, neural network sesi
  - Boyut: ~250 MB
  - Kalite: Premium
  - Ton: Net, profesyonel, genç

#### 🥈 Alternatifler:
- **Allison (Enhanced)** - Arkadaşça, sıcak
- **Zoe (Enhanced)** - İfade gücü yüksek
- **Nicky (Enhanced)** - Profesyonel, açık

### İndirme Adımları:
1. Ses listesinde "Enhanced Quality" etiketli sesleri bul
2. Sesin yanındaki **İndir** (Download) ikonuna dokun
3. İndirme tamamlanana kadar bekle (WiFi önerilir)
4. Uygulamayı yeniden başlat

### Ses Kalite Seviyeleri:
- **Default** - Robot gibi ❌
- **Compact** - Az yer kaplar ama kalite düşük ⚠️
- **Enhanced** - Doğal, akıcı ✅
- **Premium** - En yüksek kalite, neural network ⭐

## Uygulama Ayarları

Ses indirdikten sonra uygulama otomatik olarak en iyi sesi seçecek:
- **Hız (Rate)**: 0.42 - Yavaş, vurgulu, konuşkan
- **Ton (Pitch)**: 0.95 - Sıcak, doğal

## Test
1. Uygulamayı başlat
2. Console log'larına bak:
   ```
   [TTS] 🎯 FINAL SELECTION: Samantha (Quality: Enhanced)
   [TTS] 🎚️ Speech params: Rate=0.42, Pitch=0.95
   ```
3. Sesli konuş ve cevabı dinle

## Alternatif: Gerçek Zamanlı İndirme
iOS bazı premium sesleri ilk kullanımda otomatik indirebilir. Ancak manuel indirme daha güvenilir.

## Önemli Notlar
- Siri sesi uygulamalarda KULLANILMAZ (Apple politikası)
- Premium sesler WiFi üzerinden indirilmeli (büyük dosyalar)
- Her dil için ayrı premium sesler var
- Bir kez indirince tüm uygulamalarda kullanılır
