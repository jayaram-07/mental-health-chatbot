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

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

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
      throw new Error(`Upstream error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error('No reply in response');
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('LLM Error:', error);
    return res.status(502).json({ error: 'llm_error' });
  }
}
