package com.kspeaker

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.google.firebase.FirebaseApp

/**
 * iOS AppDelegate eşdeğeri - Application lifecycle yönetimi
 * iOS: AppDelegate.didFinishLaunchingWithOptions
 * Android: MainApplication.onCreate
 */
class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  /**
   * iOS AppDelegate.application(_:didFinishLaunchingWithOptions:) eşdeğeri
   * Uygulama başlatıldığında çağrılır
   */
  override fun onCreate() {
    super.onCreate()
    
    Log.d("MainApplication", "🚀 Application starting...")
    
    // 1. Firebase initialization (iOS'ta AppDelegate'de otomatik)
    initializeFirebase()
    
    // 2. Notification channels setup (iOS'ta otomatik, Android'de manuel)
    setupNotificationChannels()
    
    // 3. React Native load
    loadReactNative(this)
    
    Log.d("MainApplication", "✅ Application initialized successfully")
  }
  
  /**
   * Firebase'i başlat
   * iOS: FirebaseApp.configure() - AppDelegate'de otomatik
   * Android: Manuel initialization gerekli
   */
  private fun initializeFirebase() {
    try {
      FirebaseApp.initializeApp(this)
      Log.d("MainApplication", "✅ Firebase initialized (google-services.json)")
    } catch (e: IllegalStateException) {
      // Firebase zaten initialize edilmiş (hot reload durumu)
      Log.w("MainApplication", "⚠️ Firebase already initialized: ${e.message}")
    } catch (e: Exception) {
      // Firebase yapılandırma hatası
      Log.e("MainApplication", "❌ Firebase initialization failed: ${e.message}")
      Log.e("MainApplication", "   Check google-services.json file")
    }
  }
  
  /**
   * Notification channel'larını oluştur
   * iOS: UNUserNotificationCenter.current().setNotificationCategories()
   * Android: NotificationChannel API (Android 8.0+)
   */
  private fun setupNotificationChannels() {
    try {
      // Channel'ları oluştur
      NotificationHelper.createNotificationChannels(this)
      
      // Debug: Oluşturulan channel'ları kontrol et
      if (BuildConfig.DEBUG) {
        NotificationHelper.checkNotificationChannels(this)
      }
      
      Log.d("MainApplication", "✅ Notification channels configured")
    } catch (e: Exception) {
      Log.e("MainApplication", "❌ Notification setup failed: ${e.message}")
    }
  }
  
  /**
   * App lifecycle callback - iOS'taki applicationWillTerminate benzeri
   * Uygulama kapatılırken çağrılır
   */
  override fun onTerminate() {
    super.onTerminate()
    Log.d("MainApplication", "🛑 Application terminating...")
  }
}
