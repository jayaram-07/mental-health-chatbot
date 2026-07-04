import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getCredentials,
  getModelConfig,
  buildSystemPrompt,
  toGeminiContents,
  getAccessToken,
} from './_persona.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, emotion } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const credentials = getCredentials();
  if (!credentials) {
    return res.status(503).json({ error: 'llm_unavailable' });
  }

  const { project, location, model } = getModelConfig();

  try {
    const token = await getAccessToken(credentials);

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:streamGenerateContent?alt=sse`;

    const systemPrompt = buildSystemPrompt(emotion);
    const contents = toGeminiContents(messages);

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.8,
        // On gemini-2.5-flash the thinking tokens count against maxOutputTokens,
        // so give the reply enough headroom to survive the reasoning budget and
        // still finish (thinkingBudget 1024 of a 1536 cap leaves room for the
        // short, persona-constrained answer). Set thinkingBudget: -1 for dynamic.
        maxOutputTokens: 1536,
        thinkingConfig: { thinkingBudget: 1024 },
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'llm_error' });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    if (!response.body) {
      throw new Error('No response body');
    }

    let buffer = '';

    const processBuffer = () => {
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.write('data: ' + JSON.stringify({ delta: text }) + '\n\n');
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    try {
      // Decode every chunk to text. On Vercel's Node runtime the body is an
      // async-iterable WHATWG stream yielding Uint8Array chunks (Buffer is a
      // Uint8Array subclass too) — TextDecoder handles all of them; naive
      // string coercion of a Uint8Array would produce "100,97,..." garbage.
      const decoder = new TextDecoder('utf-8');
      const decodeChunk = (chunk: any): string =>
        typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });

      // Handle both Node Readable / async-iterable WebStream and reader-based WebStream
      if (typeof (response.body as any)[Symbol.asyncIterator] === 'function') {
        for await (const chunk of response.body as any) {
          buffer += decodeChunk(chunk);
          processBuffer();
        }
      } else {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decodeChunk(value);
          processBuffer();
        }
      }

      res.write('data: ' + JSON.stringify({ done: true }) + '\n\n');
      res.end();
    } catch (streamError) {
      console.error('Stream Error:', streamError);
      res.write('data: ' + JSON.stringify({ error: true }) + '\n\n');
      res.end();
    }
  } catch (error) {
    console.error('LLM Error:', error);
    return res.status(502).json({ error: 'llm_error' });
  }
}
