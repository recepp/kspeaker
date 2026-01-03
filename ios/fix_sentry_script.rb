require 'xcodeproj'

project_path = 'kspeaker.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first
sentry_phase = target.shell_script_build_phases.find { |p| p.name == 'Upload dSYMs to Sentry' }

if sentry_phase
  # XCFramework yapısına göre güncellenmiş script
  sentry_phase.shell_script = <<'SCRIPT'
set -e

export SENTRY_CLI_EXECUTABLE="$PROJECT_DIR/../node_modules/.bin/sentry-cli"

# Sentry CLI kontrolü
if [ ! -f "$SENTRY_CLI_EXECUTABLE" ]; then
  echo "⚠️  sentry-cli bulunamadı. npm install --save-dev @sentry/cli ile yükleyin"
  exit 0
fi

# Sadece Release build'de çalıştır
if [ "$CONFIGURATION" = "Release" ]; then
  echo "🚀 Uploading dSYMs to Sentry..."
  
  # Ana uygulama dSYM'leri
  if [ -d "$DWARF_DSYM_FOLDER_PATH" ]; then
    echo "📦 Uploading app dSYMs..."
    "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$DWARF_DSYM_FOLDER_PATH" 2>&1 || echo "⚠️  App dSYM upload warning (may be normal)"
  fi
  
  # Hermes XCFramework dSYM'leri - iOS device (arm64)
  HERMES_XCFRAMEWORK="$PODS_ROOT/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework"
  
  if [ -d "$HERMES_XCFRAMEWORK" ]; then
    echo "🔍 Searching for Hermes dSYMs in XCFramework..."
    
    # iOS device için (gerçek cihaz builds)
    IOS_DEVICE_DSYM="$HERMES_XCFRAMEWORK/ios-arm64/hermes.framework.dSYM"
    if [ -d "$IOS_DEVICE_DSYM" ]; then
      echo "📤 Uploading Hermes dSYM for iOS device (arm64)..."
      "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$IOS_DEVICE_DSYM" 2>&1 && echo "✅ iOS device Hermes dSYM uploaded" || echo "⚠️  iOS device Hermes dSYM upload failed"
    else
      echo "⚠️  iOS device Hermes dSYM not found at: $IOS_DEVICE_DSYM"
    fi
    
    # iOS simulator için
    IOS_SIM_DSYM="$HERMES_XCFRAMEWORK/ios-arm64_x86_64-simulator/hermes.framework.dSYM"
    if [ -d "$IOS_SIM_DSYM" ]; then
      echo "📤 Uploading Hermes dSYM for iOS simulator..."
      "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$IOS_SIM_DSYM" 2>&1 || echo "⚠️  Simulator dSYM upload skipped"
    fi
  else
    echo "⚠️  Hermes XCFramework not found"
  fi
  
  # Build dizinindeki diğer dSYM'ler
  if [ -d "$CONFIGURATION_BUILD_DIR" ]; then
    echo "🔍 Searching for additional dSYMs in build directory..."
    find "$CONFIGURATION_BUILD_DIR" -name "*.dSYM" -maxdepth 2 2>/dev/null | while read dsym; do
      echo "📤 Uploading: $(basename $dsym)"
      "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$dsym" 2>&1 || true
    done
  fi
  
  echo "✅ dSYM upload process completed"
else
  echo "⏭️  Skipping dSYM upload (Debug build)"
fi
SCRIPT

  project.save
  puts "✅ Sentry upload script XCFramework için güncellendi!"
else
  puts "❌ Sentry upload phase bulunamadı!"
end
