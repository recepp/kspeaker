import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ELEVENLABS_FREE_TIER,
  type ElevenLabsQuotaSnapshot,
} from './elevenLabsLimits';

const EXHAUSTED_KEY = 'elevenlabs.quota.exhaustedUntil';
const USED_CHARS_KEY = 'elevenlabs.quota.usedCharsMonth';
const USED_MONTH_KEY = 'elevenlabs.quota.monthId';

function currentMonthId(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
}

/**
 * Local quota gate (SRP): remembers API exhaustion and soft char usage
 * so we skip ElevenLabs and fall back to device TTS when budget is gone.
 */
export class ElevenLabsQuotaGate {
  async isLocallyExhausted(): Promise<boolean> {
    try {
      const until = await AsyncStorage.getItem(EXHAUSTED_KEY);
      if (!until) return false;
      if (Date.now() < Number(until)) return true;
      await AsyncStorage.removeItem(EXHAUSTED_KEY);
      return false;
    } catch {
      return false;
    }
  }

  /** Mark exhausted until next UTC month (free tier resets monthly). */
  async markExhausted(reason: string): Promise<void> {
    const now = new Date();
    const nextMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    try {
      await AsyncStorage.setItem(EXHAUSTED_KEY, String(nextMonth));
    } catch {
      // non-fatal
    }
    if (__DEV__) {
      console.warn('[ElevenLabs] Quota exhausted — falling back to device TTS:', reason);
    }
  }

  async clearExhausted(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EXHAUSTED_KEY);
    } catch {
      // ignore
    }
  }

  async getSoftUsedChars(): Promise<number> {
    try {
      const month = await AsyncStorage.getItem(USED_MONTH_KEY);
      if (month !== currentMonthId()) {
        await AsyncStorage.multiSet([
          [USED_MONTH_KEY, currentMonthId()],
          [USED_CHARS_KEY, '0'],
        ]);
        return 0;
      }
      const raw = await AsyncStorage.getItem(USED_CHARS_KEY);
      return Number(raw) || 0;
    } catch {
      return 0;
    }
  }

  async recordUsage(charCount: number): Promise<void> {
    const used = (await this.getSoftUsedChars()) + Math.max(0, charCount);
    try {
      await AsyncStorage.multiSet([
        [USED_MONTH_KEY, currentMonthId()],
        [USED_CHARS_KEY, String(used)],
      ]);
    } catch {
      // ignore
    }
    if (used >= ELEVENLABS_FREE_TIER.softMonthlyCharBudget) {
      await this.markExhausted('soft monthly budget');
    }
  }

  async canAttempt(textLength: number): Promise<boolean> {
    if (await this.isLocallyExhausted()) return false;
    if (textLength <= 0) return false;
    if (textLength > ELEVENLABS_FREE_TIER.maxCharsPerRequest) return false;
    const used = await this.getSoftUsedChars();
    return used + textLength <= ELEVENLABS_FREE_TIER.softMonthlyCharBudget;
  }

  static fromSubscription(data: {
    character_count?: number;
    character_limit?: number;
    tier?: string;
  }): ElevenLabsQuotaSnapshot {
    const characterCount = data.character_count ?? 0;
    const characterLimit = data.character_limit ?? ELEVENLABS_FREE_TIER.monthlyCredits;
    const remaining = Math.max(0, characterLimit - characterCount);
    return {
      characterCount,
      characterLimit,
      remaining,
      tier: data.tier ?? 'unknown',
      canUse: remaining > 0,
    };
  }
}

export const elevenLabsQuotaGate = new ElevenLabsQuotaGate();
