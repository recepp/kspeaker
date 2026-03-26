import { Alert, Linking, Platform, Share } from 'react-native';

// ============================================
// TYPES & INTERFACES (SOLID: Interface Segregation)
// ============================================

interface EmailResult {
  success: boolean;
  error?: string;
}

// ============================================
// EMAIL SERVICE (SOLID: Single Responsibility)
// ============================================

class EmailService {
  private static readonly SUPPORT_EMAIL = 'omer.yilmaz@kartezya.com';
  
  /**
   * Send support email by opening device's email app
   * Email will always go to omer.yilmaz@kartezya.com
   * Fallback: Copy to clipboard if no email app (simulator)
   */
  static async sendSupportEmail(
    userEmail: string,
    description: string
  ): Promise<EmailResult> {
    try {
      // Validate inputs
      if (!userEmail.trim() || !description.trim()) {
        return {
          success: false,
          error: 'Email and description are required',
        };
      }
      
      // Email regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail.trim())) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }
      
      console.log('[EmailService] 📧 Opening email app...');
      
      // Create email body
      const subject = `Kspeaker Support - ${userEmail}`;
      const body = 
        `From: ${userEmail}\n\n` +
        `Message:\n${description}\n\n` +
        `---\n` +
        `Platform: ${Platform.OS} ${Platform.Version}\n` +
        `Sent from Kspeaker app`;
      
      const mailtoUrl = `mailto:${this.SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Check if can open URL
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (!canOpen) {
        console.warn('[EmailService] ⚠️ No email app found, using Share fallback...');
        // Use Share sheet as fallback — works on both iOS and Android without extra packages
        const emailContent =
          `To: ${this.SUPPORT_EMAIL}\n` +
          `Subject: ${subject}\n\n` +
          `${body}`;

        try {
          await Share.share({ message: emailContent, title: subject });
        } catch (shareError) {
          // User cancelled share sheet — not an error
          console.log('[EmailService] Share cancelled or failed:', shareError);
        }

        Alert.alert(
          '📤 Share Email Content',
          `No email app found on this device.\n\nUse the share sheet to copy or send the content to:\n${this.SUPPORT_EMAIL}`,
          [{ text: 'OK', style: 'default' }]
        );

        return { success: true };
      }
      
      // Open email app
      await Linking.openURL(mailtoUrl);
      
      console.log('[EmailService] ✅ Email app opened successfully');
      return { success: true };
      
    } catch (error) {
      console.error('[EmailService] Error:', error);
      
      // Emergency fallback — use Share API (no Clipboard dependency)
      try {
        const emergencyContent =
          `To: ${this.SUPPORT_EMAIL}\n` +
          `From: ${userEmail}\n\n` +
          `${description}`;

        await Share.share({
          message: emergencyContent,
          title: `Kspeaker Support`,
        });

        return { success: true };
      } catch {
        return {
          success: false,
          error: `Failed to open email app. Please email support at ${this.SUPPORT_EMAIL}`,
        };
      }
    }
  }
}

// ============================================
// PUBLIC API
// ============================================

export default EmailService;
