import { useState, useRef, useCallback, useEffect } from 'react';
import { startListening, stopListening } from '../speech';
import ttsService from '../services/ttsService'; // FIXED: default import

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing';

interface UseVoiceConversationProps {
  onVoiceMessage: (text: string) => Promise<void>;
}

export function useVoiceConversation({ onVoiceMessage }: UseVoiceConversationProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  
  const voiceStateRef = useRef<VoiceState>('idle');
  const userStoppedVoice = useRef(false);
  const voiceRetryCount = useRef(0);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentVoiceText = useRef('');

  // CRITICAL FIX: Cleanup timer on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    };
  }, []);

  const startVoiceConversation = useCallback((isRetry = false) => {
    if (__DEV__) console.log('[Voice] 🎙️ Starting conversation mode, isRetry:', isRetry);
    
    setVoiceState('listening');
    voiceStateRef.current = 'listening';
    
    if (!isRetry) {
      userStoppedVoice.current = false;
      voiceRetryCount.current = 0;
    }
    
    currentVoiceText.current = '';
    let hasReceivedText = false;
    
    const resetTimer = () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      
      const timeout = hasReceivedText ? 2000 : 6000;
      
      silenceTimer.current = setTimeout(() => {
        const text = currentVoiceText.current.trim();
        
        if (text.length > 0 && voiceStateRef.current === 'listening') {
          if (__DEV__) console.log('[Voice] ✅ Silence detected, processing:', text);
          stopListening();
          setVoiceState('processing');
          voiceStateRef.current = 'processing';
          onVoiceMessage(text);
          currentVoiceText.current = '';
        } else {
          if (__DEV__) console.log('[Voice] ⏸️ Silence but no text, restarting...');
          if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
            stopListening();
            setTimeout(() => {
              if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
                startVoiceConversation(true);
              }
            }, 500);
          }
        }
      }, timeout);
    };
    
    startListening(
      (text) => {
        currentVoiceText.current = text;
        if (!hasReceivedText) {
          hasReceivedText = true;
          console.log('[Voice] 🎤 First text received');
        }
        resetTimer();
      },
      () => {
        console.log('[Voice] ❌ Speech recognition error occurred');
        
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }
        
        voiceRetryCount.current++;
        if (voiceRetryCount.current >= 3) {
          console.log('[Voice] 🛑 Max retries reached (3), stopping voice mode');
          stopVoiceConversation();
          return;
        }
        
        setTimeout(() => {
          if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
            console.log('[Voice] 🔄 Retrying after error... (attempt', voiceRetryCount.current, '/3)');
            startVoiceConversation(true);
          } else {
            console.log('[Voice] 🛑 Not retrying - user stopped or state changed');
          }
        }, 1000);
      }
    );
    
    resetTimer();
  }, [onVoiceMessage]);
  
  const stopVoiceConversation = useCallback(() => {
    console.log('[Voice] 🛑 Stopping conversation mode');
    
    userStoppedVoice.current = true;
    
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    stopListening();
    ttsService.stop();
    currentVoiceText.current = '';
    
    setVoiceState('idle');
    voiceStateRef.current = 'idle';
    
    console.log('[Voice] ✅ Voice conversation stopped, state set to idle');
  }, []);
  
  const handleMicButton = useCallback(() => {
    console.log('[Mic] 🔘 Button pressed, current state:', voiceState);
    
    if (voiceStateRef.current === 'idle') {
      console.log('[Mic] ▶️ Starting voice conversation');
      startVoiceConversation();
    } else {
      console.log('[Mic] ⏹️ Stopping voice conversation from state:', voiceStateRef.current);
      stopVoiceConversation();
    }
  }, [voiceState, startVoiceConversation, stopVoiceConversation]);

  const setVoiceStateSafe = useCallback((state: VoiceState) => {
    setVoiceState(state);
    voiceStateRef.current = state;
  }, []);

  return {
    voiceState,
    voiceStateRef,
    userStoppedVoice,
    startVoiceConversation,
    stopVoiceConversation,
    handleMicButton,
    setVoiceStateSafe,
  };
}
