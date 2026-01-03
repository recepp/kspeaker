require 'xcodeproj'

project_path = 'kspeaker.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first
sentry_phase = target.shell_script_build_phases.find { |p| p.name == 'Upload dSYMs to Sentry' }

if sentry_phase
  # Script içeriğini güncelle - node_modules içindeki sentry-cli'yi kullan
  sentry_phase.shell_script = <<SCRIPT
set -e

export SENTRY_CLI_EXECUTABLE="$PROJECT_DIR/../node_modules/.bin/sentry-cli"

# Sentry CLI'nin yüklü olup olmadığını kontrol et
if [ ! -f "$SENTRY_CLI_EXECUTABLE" ]; then
  echo "warning: sentry-cli bulunamadı. npm install --save-dev @sentry/cli komutuyla yükleyin"
  exit 0
fi

# Sadece Archive işleminde çalıştır
if [ "$CONFIGURATION" = "Release" ]; then
  echo "🚀 Uploading dSYMs to Sentry..."
  
  # Ana uygulama dSYM'lerini yükle
  if [ -d "$DWARF_DSYM_FOLDER_PATH" ]; then
    echo "📦 Uploading app dSYMs from: $DWARF_DSYM_FOLDER_PATH"
    "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$DWARF_DSYM_FOLDER_PATH" || echo "⚠️  App dSYM upload failed"
  fi
  
  # Hermes framework dSYM'lerini bul ve yükle
  HERMES_FRAMEWORK_PATH="$PODS_ROOT/hermes-engine/destroot"
  if [ -d "$HERMES_FRAMEWORK_PATH" ]; then
    echo "🔍 Searching for Hermes dSYMs in: $HERMES_FRAMEWORK_PATH"
    find "$HERMES_FRAMEWORK_PATH" -name "*.dSYM" -print0 | while IFS= read -r -d '' dsym; do
      echo "📤 Uploading Hermes dSYM: $(basename $dsym)"
      "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$dsym" || echo "⚠️  Hermes dSYM upload failed: $dsym"
    done
  else
    echo "⚠️  Hermes framework path not found: $HERMES_FRAMEWORK_PATH"
  fi
  
  # Build directory'deki tüm dSYM'leri yükle
  if [ -d "$CONFIGURATION_BUILD_DIR" ]; then
    echo "🔍 Searching for additional dSYMs in: $CONFIGURATION_BUILD_DIR"
    find "$CONFIGURATION_BUILD_DIR" -name "*.dSYM" -print0 | while IFS= read -r -d '' dsym; do
      echo "📤 Uploading dSYM: $(basename $dsym)"
      "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$dsym" || echo "⚠️  dSYM upload failed: $dsym"
    done
  fi
  
  # Pods içindeki hermes.framework.dSYM'i manuel oluştur ve yükle
  HERMES_BINARY="$PODS_ROOT/hermes-engine/destroot/Library/Frameworks/universal/hermes.framework/hermes"
  if [ -f "$HERMES_BINARY" ]; then
    echo "🔨 Creating dSYM for Hermes binary..."
    HERMES_DSYM="$CONFIGURATION_BUILD_DIR/hermes.framework.dSYM"
    dsymutil "$HERMES_BINARY" -o "$HERMES_DSYM" 2>/dev/null || echo "⚠️  Could not create Hermes dSYM"
    
    if [ -d "$HERMES_DSYM" ]; then
      echo "📤 Uploading generated Hermes dSYM..."
      "$SENTRY_CLI_EXECUTABLE" debug-files upload --include-sources "$HERMES_DSYM" || echo "⚠️  Generated Hermes dSYM upload failed"
    fi
  fi
  
  echo "✅ dSYM upload process completed"
else
  echo "⏭️  Skipping dSYM upload (not a Release build)"
fi
SCRIPT

  project.save
  puts "✅ Sentry dSYM upload script güncellendi!"
else
  puts "❌ Sentry upload script bulunamadı!"
end
