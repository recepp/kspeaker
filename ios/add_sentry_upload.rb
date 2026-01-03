require 'xcodeproj'

project_path = 'kspeaker.xcodeproj'
project = Xcodeproj::Project.open(project_path)

target = project.targets.first
phase = target.new_shell_script_build_phase('Upload dSYMs to Sentry')

# Script içeriği
phase.shell_script = <<SCRIPT
set -e

# Sentry CLI'nin yüklü olup olmadığını kontrol et
if ! command -v sentry-cli &> /dev/null; then
  echo "warning: sentry-cli bulunamadı. npm install -g @sentry/cli komutuyla yükleyin"
  exit 0
fi

# Sadece Archive işleminde çalıştır
if [ "$CONFIGURATION" = "Release" ] && [ "$EFFECTIVE_PLATFORM_NAME" = "-iphoneos" ]; then
  echo "Uploading dSYMs to Sentry..."
  
  # Ana uygulama dSYM'lerini yükle
  sentry-cli debug-files upload --include-sources "$DWARF_DSYM_FOLDER_PATH"
  
  # Hermes framework dSYM'lerini bul ve yükle
  HERMES_FRAMEWORK_PATH="$PODS_ROOT/../ios/Pods/hermes-engine/destroot"
  if [ -d "$HERMES_FRAMEWORK_PATH" ]; then
    echo "Hermes dSYM'leri aranıyor..."
    find "$HERMES_FRAMEWORK_PATH" -name "*.dSYM" -print0 | while IFS= read -r -d '' dsym; do
      echo "Uploading Hermes dSYM: $dsym"
      sentry-cli debug-files upload --include-sources "$dsym"
    done
  fi
  
  # Build directory'deki tüm dSYM'leri yükle
  if [ -d "$CONFIGURATION_BUILD_DIR" ]; then
    find "$CONFIGURATION_BUILD_DIR" -name "*.dSYM" -print0 | while IFS= read -r -d '' dsym; do
      echo "Uploading dSYM: $dsym"
      sentry-cli debug-files upload --include-sources "$dsym"
    done
  fi
  
  echo "dSYM upload tamamlandı"
else
  echo "Skipping dSYM upload (not a Release build or not on device)"
fi
SCRIPT

# Script'i Bundle React Native code'dan sonra çalıştır
bundle_react_phase = target.shell_script_build_phases.find { |p| p.name == 'Bundle React Native code and images' }
if bundle_react_phase
  target.build_phases.delete(phase)
  bundle_index = target.build_phases.index(bundle_react_phase)
  target.build_phases.insert(bundle_index + 1, phase)
end

# Input files ekle (değişiklik takibi için)
phase.input_paths = ['$(DWARF_DSYM_FOLDER_PATH)']
phase.output_paths = []

# Sadece Archive işleminde çalışsın
phase.always_out_of_date = "1"

project.save
puts "✅ Sentry dSYM upload script başarıyla eklendi!"
