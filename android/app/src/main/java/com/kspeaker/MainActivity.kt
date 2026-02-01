package com.kspeaker

import android.content.Intent
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "kspeaker"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  // iOS AppDelegate.didFinishLaunchingWithOptions eşdeğeri
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    Log.d("MainActivity", "✅ onCreate called")
    
    // Handle notification intent when app is launched from notification
    handleNotificationIntent(intent)
  }

  // iOS AppDelegate.didReceive response eşdeğeri - notification tap handling
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
    Log.d("MainActivity", "🔔 onNewIntent called")
    
    // Handle notification when app is already running
    intent?.let { handleNotificationIntent(it) }
  }

  /**
   * iOS'taki userNotificationCenter(_:didReceive:) metodunun Android karşılığı
   * Bildirime tıklandığında veya uygulama bildirimden açıldığında çağrılır
   */
  private fun handleNotificationIntent(intent: Intent) {
    val extras = intent.extras
    if (extras != null && extras.containsKey("notification_id")) {
      val notificationId = extras.getString("notification_id", "")
      val title = extras.getString("title", "")
      val message = extras.getString("message", "")
      
      Log.d("MainActivity", "📲 Notification tapped - ID: $notificationId, Title: $title")
      
      // React Native'e bildirim event'ini gönder (iOS'taki gibi)
      sendNotificationEventToJS(notificationId, title, message)
    } else {
      Log.d("MainActivity", "ℹ️ Normal app launch (not from notification)")
    }
  }

  /**
   * Notification event'ini React Native JS tarafına gönder
   * iOS'ta UNUserNotificationCenter delegate'i otomatik yapar
   * Android'de manuel event emit gerekir
   */
  private fun sendNotificationEventToJS(notificationId: String, title: String, message: String) {
    try {
      val params: WritableMap = Arguments.createMap().apply {
        putString("id", notificationId)
        putString("title", title)
        putString("message", message)
        putString("action", "notification_opened")
      }
      
      // React Native event emitter (notificationService.ts dinleyecek)
      reactInstanceManager?.currentReactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("notificationOpened", params)
        
      Log.d("MainActivity", "✅ Notification event sent to JS")
    } catch (e: Exception) {
      Log.e("MainActivity", "❌ Error sending notification to JS: ${e.message}")
    }
  }

  // iOS'taki applicationWillResignActive benzeri - opsiyonel
  override fun onPause() {
    super.onPause()
    Log.d("MainActivity", "⏸️ App paused")
  }

  // iOS'taki applicationDidBecomeActive benzeri - opsiyonel
  override fun onResume() {
    super.onResume()
    Log.d("MainActivity", "▶️ App resumed")
  }
}
