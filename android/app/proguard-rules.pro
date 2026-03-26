# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ============================================
# React Native Core Rules (iOS'ta otomatik)
# ============================================
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# React Native bridge
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * {
    native <methods>;
}

# ============================================
# Firebase Rules (iOS'ta CocoaPods halleder)
# ============================================
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Messaging
-keep class com.google.firebase.messaging.** { *; }
-keep class com.google.firebase.iid.** { *; }

# ============================================
# React Native Libraries
# ============================================

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native NetInfo
-keep class com.reactnativecommunity.netinfo.** { *; }

# React Native Voice
-keep class com.wenkesj.voice.** { *; }

# React Native TTS
-keep class net.no_mad.tts.** { *; }

# React Native Push Notification
-keep class com.dieam.reactnativepushnotification.** { *; }

# React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# React Native Linear Gradient
-keep class com.BV.LinearGradient.** { *; }

# React Native Blur
-keep class com.reactnativecommunity.blurview.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# React Native Device Info
-keep class com.learnium.RNDeviceInfo.** { *; }

# Sentry
-keep class io.sentry.** { *; }
-dontwarn io.sentry.**

# ============================================
# Kotlin & Coroutines
# ============================================
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# ============================================
# OkHttp & Networking (iOS URLSession eşdeğeri)
# ============================================
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ============================================
# JSON Parsing (iOS Codable/JSONSerialization)
# ============================================
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep all model classes that might be serialized
-keep class * implements java.io.Serializable { *; }

# ============================================
# JavaScript Interface (React Native Bridge)
# ============================================
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ============================================
# Debugging (Release build için optional)
# ============================================
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ============================================
# Remove Logging in Production (iOS'ta #if DEBUG)
# ============================================
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# ============================================
# App Specific Rules
# ============================================
-keep class com.kspeaker.** { *; }

# Keep MainActivity intent handling
-keep class com.kspeaker.MainActivity {
    public *;
}

# Keep MainApplication
-keep class com.kspeaker.MainApplication {
    public *;
}

# Keep NotificationHelper
-keep class com.kspeaker.NotificationHelper {
    public *;
}
