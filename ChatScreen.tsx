import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Keyboard, Platform, Alert, KeyboardAvoidingView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendChatMessage, initializeApi, registerUser } from './api';
import { checkRegistration, saveRegistration } from './registration';
import { EmailRegistrationModal } from './components/EmailRegistrationModal';
import { startListening, stopListening } from './speech';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const ChatScreen: React.FC = () => {
  // State declarations
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [ttsActive, setTtsActive] = useState(false);
  const [ttsStoppedManually, setTtsStoppedManually] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs to keep latest values inside event handlers added once
  const listeningRef = useRef(listening);
  const ttsStoppedManuallyRef = useRef(ttsStoppedManually);
  const isSending = useRef(false);

  // Handler functions
  const handleSend = async () => {
    if (input.trim() && !isSending.current) {
      isSending.current = true;
      const userMsg = { id: Date.now().toString(), text: input, sender: 'user' } as const;
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      Keyboard.dismiss();
      try {
        const reply = await sendChatMessage(userMsg.text);
        const botMsg = { id: (Date.now()+1).toString(), text: reply, sender: 'bot' } as const;
        setMessages(prev => [...prev, botMsg]);
        
        // Text input ile gönderimde voice mode'u kapat
        setVoiceModeActive(false);
      } catch (e) {
        setMessages(prev => [...prev, { id: (Date.now()+2).toString(), text: 'API error', sender: 'bot' } as const]);
      } finally {
        isSending.current = false;
      }
    }
  };

  const handleSendByVoice = async (voiceText: string) => {
    if (!isSending.current) {
      isSending.current = true;
      // Hemen input'u temizle
      setInput('');
      
      const userMsg = { id: Date.now().toString(), text: voiceText, sender: 'user' } as const;
      setMessages(prev => [...prev, userMsg]);
      Keyboard.dismiss();
      try {
        const reply = await sendChatMessage(voiceText);
        const botMsg = { id: (Date.now()+1).toString(), text: reply, sender: 'bot' } as const;
        setMessages(prev => [...prev, botMsg]);
        setTtsActive(true);
        Tts.speak(reply);
      } catch (e) {
        setMessages(prev => [...prev, { id: (Date.now()+2).toString(), text: 'API error', sender: 'bot' } as const]);
      } finally {
        isSending.current = false;
      }
    }
  };

  const handleMic = () => {
    try {
      if (ttsActive) return; // Don't open mic during TTS
      
      // If already listening, stop it
      if (listening) {
        stopListening();
        setListening(false);
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }
        return;
      }

      // Start new listening session
      setInput('');
      setListening(true);
      setVoiceModeActive(true);

      const speechState = {
        currentText: '',
        hasReceivedInput: false
      };

      const startSilenceTimer = () => {
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
        }

        const timeout = speechState.hasReceivedInput ? 2000 : 5000; // Input varsa 2sn, yoksa 5sn
        
        silenceTimer.current = setTimeout(async () => {
          try {
            const textToSend = speechState.currentText.trim();
            
            // Önce mikrofonun kapanması için gerekli işlemler
            stopListening();
            setListening(false);
            
            // Eğer text varsa gönder
            if (textToSend) {
              await handleSendByVoice(textToSend);
            }
            
            setVoiceModeActive(false);
          } catch (err) {
            console.error('Error in silence timer:', err);
          }
        }, timeout);
      };

      // Start listening with the new timer logic
      startListening((text) => {
        console.debug('[speech] recognition result:', text);
        speechState.currentText = text;
        speechState.hasReceivedInput = true;
        startSilenceTimer();
      });

      // Initial silence timer
      startSilenceTimer();

    } catch (err) {
      setListening(false);
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      Alert.alert('Microphone error', String(err));
    }
  };

  const handleStopTTS = async () => {
    try {
      // Clear any existing timers
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }

      // Stop TTS if active
      if (ttsActive) {
        await new Promise<void>((resolve) => {
          // First try to stop without parameters
          Promise.all([
            Tts.setDefaultRate(1.0),
            Tts.setDefaultPitch(1.0),
            Tts.setDefaultLanguage('en-US')
          ]).then(() => {
            return Tts.stop();
          }).then(() => {
            resolve();
          }).catch((err: unknown) => {
            console.error('Error stopping TTS:', err);
            resolve(); // Still resolve to continue cleanup
          });
        });
      }
      
      // Stop microphone if active
      if (listening) {
        await new Promise<void>((resolve) => {
          stopListening();
          resolve();
        });
      }

      // Reset all states to initial values
      setTtsActive(false);
      setTtsStoppedManually(true);
      setListening(false);
      setInput('');
      
      // Hoparlör kapandığında mikrofonun 5 saniye dinlemesi için
      if (!listening) {
        handleMic(); // Mikrofonu aç
      }

    } catch (err) {
      console.error('Error in handleStopTTS:', err);
      Alert.alert('Error', 'Failed to stop. Please try again.');
    }
  };

  // Handle email registration
  const handleEmailSubmit = async (email: string) => {
    try {
      const success = await registerUser(email);
      if (success) {
        await saveRegistration(email);
        setShowEmailModal(false);
      }
      return success;
    } catch (error) {
      console.error('Error during registration:', error);
      return false;
    }
  };

  // Effects
  // Initialize API, check registration and cleanup timer when component mounts
  React.useEffect(() => {
    const initialize = async () => {
      try {
        await initializeApi();
        
        // Check if user is registered
        const registration = await checkRegistration();
        if (!registration) {
          setShowEmailModal(true);
        }
      } catch (err) {
        console.error('Error during initialization:', err);
      }
    };

    initialize();

    return () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
    };
  }, []);

  // keep refs in sync with state so event handlers (registered once) see latest values
  React.useEffect(() => { listeningRef.current = listening; }, [listening]);
  React.useEffect(() => { ttsStoppedManuallyRef.current = ttsStoppedManually; }, [ttsStoppedManually]);

  // TTS setup effect
  React.useEffect(() => {
    try {
      Tts.setDefaultLanguage('en-US');

      // Handlers are defined once and use refs to read latest state
      const handleTTSStart = () => {
        try {
          setTtsActive(true);
          setVoiceModeActive(false);
          // If we were listening, stop it
          if (listeningRef.current) {
            stopListening();
            setListening(false);
          }
          // Clear any existing timer when TTS starts
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
          setTtsStoppedManually(false); // TTS başladığında manual stop'u sıfırla
        } catch (err) {
          console.error('Error in TTS start handler:', err);
        }
      };

      const handleTTSFinish = async () => {
        try {
          setTtsActive(false);

          // TTS bittiyse ve manuel durdurulmadıysa mikrofonu aç
          if (!ttsStoppedManuallyRef.current) {
            // Temiz başlangıç için timer'ı sıfırla
            if (silenceTimer.current) {
              clearTimeout(silenceTimer.current);
              silenceTimer.current = null;
            }

            // İnput'u temizle ve mikrofonu aç
            setInput('');
            setListening(true);
            setVoiceModeActive(true);

            const speechState = {
              currentText: '',
              hasReceivedInput: false
            };

            const startSilenceTimer = () => {
              if (silenceTimer.current) {
                clearTimeout(silenceTimer.current);
              }

              const timeout = speechState.hasReceivedInput ? 2000 : 5000;
              
              silenceTimer.current = setTimeout(async () => {
                try {
                  const textToSend = speechState.currentText.trim();
                  
                  stopListening();
                  setListening(false);
                  
                  if (textToSend) {
                    await handleSendByVoice(textToSend);
                  }
                  
                  setVoiceModeActive(false);
                } catch (err) {
                  console.error('Error in silence timer:', err);
                }
              }, timeout);
            };

            // Mikrofonu başlat
            startListening((text) => {
              try {
                console.debug('[speech] recognition result:', text);
                speechState.currentText = text;
                speechState.hasReceivedInput = true;
                startSilenceTimer();
              } catch (error) {
                console.error('Error in speech recognition:', error);
              }
            });

            // İlk timer'ı başlat
            startSilenceTimer();
          }
        } catch (err) {
          console.error('Error in TTS finish handler:', err);
          // Hata durumunda temizlik yap
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
          setTtsActive(false);
          setListening(false);
        }
      };

      const handleTTSCancel = () => {
        try {
          setTtsActive(false);
          // Clear any timers on cancel
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
        } catch (err) {
          console.error('Error in TTS cancel handler:', err);
        }
      };

      // Add event listeners once
      Tts.addEventListener('tts-start', handleTTSStart);
      Tts.addEventListener('tts-finish', handleTTSFinish);
      Tts.addEventListener('tts-cancel', handleTTSCancel);

      // Cleanup function
      return () => {
        try {
          // Remove the exact handlers we added
          Tts.removeEventListener('tts-start', handleTTSStart as any);
          Tts.removeEventListener('tts-finish', handleTTSFinish as any);
          Tts.removeEventListener('tts-cancel', handleTTSCancel as any);
          // Clear any remaining timers
          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
            silenceTimer.current = null;
          }
        } catch (err) {
          console.error('Error cleaning up TTS listeners:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up TTS:', err);
    }
  }, []);

  React.useEffect(() => {
    if (!ttsActive && ttsStoppedManually) {
      setTtsStoppedManually(false);
    }
  }, [ttsActive, ttsStoppedManually]);

  React.useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // JSX
  return (
    <SafeAreaView style={styles.safeArea}>
      <EmailRegistrationModal 
        visible={showEmailModal}
        onSubmit={handleEmailSubmit}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>kspeaker</Text>
        </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={item.sender === 'user' ? styles.userText : styles.botText}>{item.text}</Text>
          </View>
        )}
        style={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            listening && styles.inputListening
          ]}
          value={input}
          onChangeText={setInput}
          placeholder={listening ? "Listening..." : "Type Anything"}
          placeholderTextColor={listening ? "#007AFF" : "#999"}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!listening}
        />
        {ttsActive ? (
          <TouchableOpacity onPress={handleStopTTS} style={styles.micButton}>
            <MaterialCommunityIcons name="stop" size={32} color="#d32f2f" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleMic} style={styles.micButton}>
            {listening ? (
              <MaterialCommunityIcons name="microphone" size={32} color="#007AFF" />
            ) : (
              <MaterialCommunityIcons name="microphone" size={32} color="#555" />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={handleSend} 
          style={styles.sendButton}
          disabled={!input.trim()}
        >
          <View style={[
            styles.sendIconWrapper,
            input.trim() ? styles.sendIconWrapperActive : styles.sendIconWrapperInactive
          ]}>
            <Ionicons name="arrow-up" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: -8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 1,
  },
  messages: {
    flex: 1,
    marginBottom: 8,
    marginTop: 8,
    paddingBottom: 32,
    paddingTop: 8,
  },
  messageBubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#e1e1e1',
    alignSelf: 'flex-start',
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#f5f5f7',
    fontSize: 16,
    color: '#222',
  },
  inputListening: {
    backgroundColor: '#E3F2FD',
    color: '#007AFF',
  },
  micButton: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    borderRadius: 16,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sendIconWrapperActive: {
    backgroundColor: '#007AFF',
  },
  sendIconWrapperInactive: {
    backgroundColor: '#e1e1e1',
  },
});

export default ChatScreen;