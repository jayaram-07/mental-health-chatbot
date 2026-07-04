export async function fetchChatResponse(
  messages: { role: 'user' | 'assistant'; text: string }[],
  emotion?: string,
  signal?: AbortSignal
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  // If the passed signal aborts, abort our internal controller
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', onAbort);
    }
  }

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
    if (signal) signal.removeEventListener('abort', onAbort);

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
    if (signal) signal.removeEventListener('abort', onAbort);
    throw error;
  }
}

export async function streamChatResponse(
  messages: { role: 'user' | 'assistant'; text: string }[],
  emotion: string | undefined,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, emotion }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/event-stream')) {
    throw new Error('Expected text/event-stream response');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let hasEmitted = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let doubleNewlineIndex;
      while ((doubleNewlineIndex = buffer.indexOf('\n\n')) >= 0) {
        const eventStr = buffer.slice(0, doubleNewlineIndex).trim();
        buffer = buffer.slice(doubleNewlineIndex + 2);

        if (!eventStr) continue;

        const lines = eventStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            const data = JSON.parse(dataStr);
            if (data.delta) {
              hasEmitted = true;
              onDelta(data.delta);
            } else if (data.done) {
              return;
            } else if (data.error) {
              throw new Error('Stream error from server');
            }
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    if (hasEmitted) {
      throw error;
    } else {
      throw new Error('Failed before emitting any deltas');
    }
  }
}
