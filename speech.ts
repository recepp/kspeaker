import Voice from '@react-native-community/voice';

export function startListening(onResult: (text: string) => void) {
  Voice.onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      onResult(event.value[0]);
    }
  };
  Voice.start('en-US');
}

export function stopListening() {
  Voice.stop();
}
