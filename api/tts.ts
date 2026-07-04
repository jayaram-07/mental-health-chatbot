import { getCredentials, getModelConfig, getAccessToken } from './_persona.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Invalid text' });
  }

  const credentials = getCredentials();
  if (!credentials) {
    return res.status(503).json({ error: 'tts_unavailable' });
  }

  try {
    const token = await getAccessToken(credentials);
    const config = getModelConfig();
    const projectId = config.project;

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': projectId,
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: voice || 'en-US-Chirp3-HD-Aoede',
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }),
    });

    if (!response.ok) {
      console.error('TTS upstream error:', response.status, await response.text());
      return res.status(502).json({ error: 'tts_error' });
    }

    const data = await response.json();
    if (!data.audioContent) {
      return res.status(502).json({ error: 'tts_error' });
    }

    return res.status(200).json({ audioContent: data.audioContent });
  } catch (error) {
    console.error('TTS error:', error);
    return res.status(502).json({ error: 'tts_error' });
  }
}
