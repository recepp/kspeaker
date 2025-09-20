// Simple API request function for chat
export async function sendChatMessage(text: string): Promise<string> {
  const response = await fetch('https://kartezya-ai.up.railway.app/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  // Adjust according to actual response structure
  return data.response || data.reply || 'No response';
}
