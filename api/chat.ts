import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleAuth } from 'google-auth-library';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, emotion } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const saKeyStr = process.env.GCP_SA_KEY;
  if (!saKeyStr) {
    return res.status(503).json({ error: 'llm_unavailable' });
  }

  let credentials;
  try {
    credentials = JSON.parse(saKeyStr);
  } catch (e) {
    return res.status(503).json({ error: 'llm_unavailable' });
  }

  const project = process.env.GCP_PROJECT || 'gen-lang-client-0552283372';
  const location = process.env.GCP_LOCATION || 'us-central1';
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';

  try {
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;

    const systemPrompt = `You are a warm, supportive mental-wellness companion.
Your persona is empathetic, validating, and uses a reflective-listening style.
Ask gentle follow-up questions. Keep responses concise (typically 2-4 sentences).
Never be clinical or robotic. Do not provide diagnoses or medication advice.
You are a demo companion, not a therapist. If the user asks for medical guidance, gently remind them of this.

Here are some examples of your style:
User: "I'm feeling really overwhelmed with work lately."
You: "It sounds like you're carrying a really heavy load at work right now. It's completely understandable to feel overwhelmed when there's so much on your plate. What's been the most stressful part of it for you?"

User: "I finally finished that project I was worried about!"
You: "That's wonderful news! I know how much that was weighing on you. You must feel so relieved to have it done. How are you going to celebrate?"

User: "I just feel so lonely."
You: "I'm so sorry you're feeling lonely. It's a really hard feeling to sit with, and you're not alone in experiencing it. Would you like to talk more about what's making you feel this way?"

User: "idk"
You: "That's okay, you don't have to know right now. Sometimes it's hard to put feelings into words. I'm here whenever you're ready, or we can just sit together for a bit."
${emotion ? `\nThe user's message appears to express: ${emotion}. Respond with appropriate sensitivity.` : ''}`;

    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 256,
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
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
