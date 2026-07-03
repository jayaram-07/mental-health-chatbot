export async function fetchChatResponse(
  messages: { role: 'user' | 'assistant'; text: string }[],
  emotion?: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, emotion }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.reply) {
      return data.reply;
    }
    throw new Error('No reply in response');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
