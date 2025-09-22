// ...existing code...
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Keyboard, Platform, Alert, KeyboardAvoidingView, Image } from 'react-native';
import { sendChatMessage } from './api';
import { startListening, stopListening } from './speech';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';

interface Message {
  id: string;
  text: string;
}

const ChatScreen: React.FC = () => {
  // TTS listeners and language setup
  React.useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.addEventListener('tts-start', () => {});
    Tts.addEventListener('tts-finish', () => {});
    Tts.addEventListener('tts-cancel', () => {});
    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleMic = () => {
    try {
      setInput(''); // Clear input box
      if (!listening) {
        setListening(true);
        startListening((text) => {
          setInput(text);
          setListening(false);
        });
      } else {
        stopListening();
        setListening(false);
      }
    } catch (err) {
      setListening(false);
      Alert.alert('Microphone error', String(err));
    }
  };

  const handleSend = async () => {
    if (input.trim()) {
      const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      Keyboard.dismiss();
      try {
        const reply = await sendChatMessage(userMsg.text);
        const botMsg = { id: (Date.now()+1).toString(), text: reply, sender: 'bot' };
        setMessages(prev => [...prev, botMsg]);
        Tts.speak(reply);
      } catch (e) {
        setMessages(prev => [...prev, { id: (Date.now()+2).toString(), text: 'API error', sender: 'bot' }]);
      }
    }
  };

  React.useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.logoContainer}>
        {/* Replace with your logo image if available */}
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
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type Anything"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={handleMic} style={styles.micButton}>
          {listening ? (
            <MaterialCommunityIcons name="microphone-settings" size={32} color="#007AFF" />
          ) : (
            <MaterialCommunityIcons name="microphone" size={32} color="#555" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <View style={styles.sendIconWrapper}>
            <Ionicons name="arrow-up" size={32} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginTop: 64,
    paddingBottom: 32,
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
  micButton: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#e1e1e1',
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
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default ChatScreen;
