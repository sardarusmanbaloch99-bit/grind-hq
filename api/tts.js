// /api/tts.js — Text to Voice using OpenAI TTS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        voice: voice || 'ember',
        input: text.substring(0, 4000),
        speed: speed || 1.05
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('TTS error:', errText);
      return res.status(500).json({ error: 'TTS failed' });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
