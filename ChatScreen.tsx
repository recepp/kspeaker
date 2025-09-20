import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Keyboard, Platform, Alert } from 'react-native';
import { sendChatMessage } from './api';
import { startListening, stopListening } from './speech';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Tts from 'react-native-tts';

interface Message {
  id: string;
  text: string;
}

const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

  const handleMic = () => {
    try {
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

  React.useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <View style={styles.container}>
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
          placeholder="Type a message or speak to the mic..."
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={handleMic} style={styles.micButton}>
          <MaterialCommunityIcons name="microphone" size={32} color={listening ? '#007AFF' : '#555'} />
        </TouchableOpacity>
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  messages: {
    flex: 1,
    marginBottom: 8,
    marginTop: 40,
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
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  micButton: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;
