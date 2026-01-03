#!/bin/bash
set -e

export CONFIGURATION="Release"
export PODS_ROOT="$PWD/Pods"
export PROJECT_DIR="$PWD"
export DWARF_DSYM_FOLDER_PATH="$PWD/build/kspeaker.xcarchive/dSYMs"
export CONFIGURATION_BUILD_DIR="$PWD/build/Release-iphoneos"

SENTRY_CLI_EXECUTABLE="$PROJECT_DIR/../node_modules/.bin/sentry-cli"

echo "=== TEST: Sentry dSYM Upload Script ==="
echo ""
echo "📍 PODS_ROOT: $PODS_ROOT"
echo "📍 PROJECT_DIR: $PROJECT_DIR"
echo "📍 SENTRY_CLI: $SENTRY_CLI_EXECUTABLE"
echo ""

# Sentry CLI kontrolü
if [ ! -f "$SENTRY_CLI_EXECUTABLE" ]; then
  echo "❌ sentry-cli bulunamadı!"
  exit 1
else
  echo "✅ sentry-cli bulundu: $SENTRY_CLI_EXECUTABLE"
fi

# Hermes XCFramework kontrolü
HERMES_XCFRAMEWORK="$PODS_ROOT/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework"
echo ""
echo "🔍 Hermes XCFramework kontrolü..."
if [ -d "$HERMES_XCFRAMEWORK" ]; then
  echo "✅ Hermes XCFramework bulundu"
  
  # iOS device dSYM kontrolü
  IOS_DEVICE_DSYM="$HERMES_XCFRAMEWORK/ios-arm64/hermes.framework.dSYM"
  if [ -d "$IOS_DEVICE_DSYM" ]; then
    echo "✅ iOS device Hermes dSYM bulundu"
    echo "   UUID'ler:"
    dwarfdump --uuid "$IOS_DEVICE_DSYM/Contents/Resources/DWARF/hermes" 2>/dev/null | head -3
  else
    echo "❌ iOS device Hermes dSYM bulunamadı: $IOS_DEVICE_DSYM"
  fi
  
  # iOS simulator dSYM kontrolü
  IOS_SIM_DSYM="$HERMES_XCFRAMEWORK/ios-arm64_x86_64-simulator/hermes.framework.dSYM"
  if [ -d "$IOS_SIM_DSYM" ]; then
    echo "✅ iOS simulator Hermes dSYM bulundu"
  else
    echo "⚠️  iOS simulator Hermes dSYM bulunamadı"
  fi
else
  echo "❌ Hermes XCFramework bulunamadı!"
fi

echo ""
echo "=== TEST TAMAMLANDI ==="
