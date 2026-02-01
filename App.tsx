/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './ChatScreen';
import LevelSelectionScreen from './LevelSelectionScreen';
import FlashcardScreen from './FlashcardScreen';
import AccountDeletionScreen from './AccountDeletionScreen';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#1A1A2E' },
          }}
        >
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="LevelSelection" component={LevelSelectionScreen} />
          <Stack.Screen name="Flashcard" component={FlashcardScreen} />
          <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
