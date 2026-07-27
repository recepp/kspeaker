#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="$ROOT/android/app/build/outputs/apk/debug/kspeaker-debug-1.0.1-debug-20260727.apk"
PKG="com.kspeaker"

if [[ ! -f "$APK" ]]; then
  echo "APK bulunamadı, debug build alınıyor..."
  (cd "$ROOT/android" && ./gradlew assembleDebug)
fi

echo "Bağlı cihazlar:"
adb devices -l

DEVICE_COUNT=$(adb devices | awk 'NR>1 && $2=="device"{print $1}' | wc -l | tr -d ' ')
if [[ "$DEVICE_COUNT" == "0" ]]; then
  echo ""
  echo "HATA: Telefon görünmüyor."
  echo "Samsung A35'te: Ayarlar → Geliştirici seçenekleri → USB hata ayıklama AÇIK"
  echo "Kablo takılıyken telefonda 'Bu bilgisayara izin ver' uyarısını onaylayın."
  exit 1
fi

echo ""
echo "Kurulum: $APK"
adb install -r "$APK"

echo ""
echo "Uygulama açılıyor..."
adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || \
  adb shell am start -n "$PKG/.MainActivity"

echo "Kurulum tamam. Telefonda Kspeaker açılmalı."
