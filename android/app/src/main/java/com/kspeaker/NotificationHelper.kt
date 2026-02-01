package com.kspeaker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * iOS'ta notification channel yönetimi otomatik (UNNotificationCategory)
 * Android'de manuel channel oluşturma gerekli (API 26+)
 * 
 * iOS AppDelegate eşdeğeri: UNUserNotificationCenter.current().setNotificationCategories()
 */
object NotificationHelper {
    
    // Channel IDs - iOS'taki category identifier'lar gibi
    const val CHANNEL_ID_REMINDERS = "kspeaker-reminders"
    const val CHANNEL_ID_ALERTS = "kspeaker-alerts"
    const val CHANNEL_ID_GENERAL = "kspeaker-general"
    
    // Channel Names
    private const val CHANNEL_NAME_REMINDERS = "Daily Practice Reminders"
    private const val CHANNEL_NAME_ALERTS = "Important Alerts"
    private const val CHANNEL_NAME_GENERAL = "General Notifications"
    
    // Channel Descriptions
    private const val CHANNEL_DESC_REMINDERS = "Daily reminders to practice English conversation"
    private const val CHANNEL_DESC_ALERTS = "Important app notifications and updates"
    private const val CHANNEL_DESC_GENERAL = "General app notifications"
    
    /**
     * Tüm notification channel'larını oluştur
     * iOS'ta AppDelegate.didFinishLaunchingWithOptions'da çağrılır
     * Android'de MainApplication.onCreate'de çağrılır
     */
    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            
            // 1. Reminders Channel (High Priority - iOS'taki .sound + .alert)
            val remindersChannel = NotificationChannel(
                CHANNEL_ID_REMINDERS,
                CHANNEL_NAME_REMINDERS,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESC_REMINDERS
                enableLights(true)
                lightColor = Color.parseColor("#4A90E2")
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300) // iOS haptic feedback benzeri
                setShowBadge(true)
                
                // iOS'taki notification sound eşdeğeri
                val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build()
                setSound(soundUri, audioAttributes)
            }
            
            // 2. Alerts Channel (Urgent - iOS'taki .criticalAlert benzeri)
            val alertsChannel = NotificationChannel(
                CHANNEL_ID_ALERTS,
                CHANNEL_NAME_ALERTS,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_DESC_ALERTS
                enableLights(true)
                lightColor = Color.RED
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 200, 500)
                setShowBadge(true)
            }
            
            // 3. General Channel (Low Priority - iOS'taki sessiz bildirimler)
            val generalChannel = NotificationChannel(
                CHANNEL_ID_GENERAL,
                CHANNEL_NAME_GENERAL,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = CHANNEL_DESC_GENERAL
                enableLights(true)
                lightColor = Color.parseColor("#7DD3C0")
                setShowBadge(false)
            }
            
            // Channel'ları kaydet
            notificationManager.createNotificationChannel(remindersChannel)
            notificationManager.createNotificationChannel(alertsChannel)
            notificationManager.createNotificationChannel(generalChannel)
            
            Log.d("NotificationHelper", "✅ Notification channels created successfully")
            Log.d("NotificationHelper", "   - ${CHANNEL_ID_REMINDERS}: High importance (iOS .sound + .alert)")
            Log.d("NotificationHelper", "   - ${CHANNEL_ID_ALERTS}: High importance (iOS .criticalAlert)")
            Log.d("NotificationHelper", "   - ${CHANNEL_ID_GENERAL}: Default importance (iOS silent)")
        } else {
            Log.d("NotificationHelper", "ℹ️ Android < 8.0, notification channels not needed")
        }
    }
    
    /**
     * Mevcut channel'ları kontrol et ve logla
     * Debug amaçlı - iOS'ta UNUserNotificationCenter.getNotificationCategories() benzeri
     */
    fun checkNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channels = notificationManager.notificationChannels
            
            Log.d("NotificationHelper", "📋 Registered notification channels: ${channels.size}")
            channels.forEach { channel ->
                Log.d("NotificationHelper", "   - ${channel.id}: ${channel.name} (Importance: ${channel.importance})")
            }
        }
    }
    
    /**
     * Belirli bir channel'ı sil
     * iOS'taki UNUserNotificationCenter.removeNotificationCategories benzeri
     */
    fun deleteNotificationChannel(context: Context, channelId: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.deleteNotificationChannel(channelId)
            Log.d("NotificationHelper", "🗑️ Channel deleted: $channelId")
        }
    }
    
    /**
     * Notification builder helper - iOS'taki UNMutableNotificationContent benzeri
     */
    fun buildNotification(
        context: Context,
        channelId: String,
        title: String,
        message: String,
        priority: Int = NotificationCompat.PRIORITY_HIGH
    ): NotificationCompat.Builder {
        return NotificationCompat.Builder(context, channelId)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.mipmap.ic_launcher) // iOS'taki app icon
            .setColor(Color.parseColor("#4A90E2"))
            .setPriority(priority)
            .setAutoCancel(true) // iOS'taki tap-to-dismiss
            .setDefaults(NotificationCompat.DEFAULT_ALL)
    }
    
    /**
     * Channel izinlerini kontrol et
     * iOS'taki UNUserNotificationCenter.getNotificationSettings benzeri
     */
    fun areNotificationsEnabled(context: Context): Boolean {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = notificationManager.getNotificationChannel(CHANNEL_ID_REMINDERS)
            channel != null && channel.importance != NotificationManager.IMPORTANCE_NONE
        } else {
            // Android < 8.0 için NotificationManagerCompat kullan
            androidx.core.app.NotificationManagerCompat.from(context).areNotificationsEnabled()
        }
    }
}
