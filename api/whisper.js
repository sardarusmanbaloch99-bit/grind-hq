// /api/whisper.js — Voice to Text using OpenAI Whisper

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audio, mimeType, language } = req.body;
    if (!audio) return res.status(400).json({ error: 'No audio provided' });

    const audioBuffer = Buffer.from(audio, 'base64');
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const ext = mimeType && mimeType.includes('mp4') ? 'mp4' : 'webm';
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="audio.${ext}"\r\n`;
    body += `Content-Type: ${mimeType || 'audio/webm'}\r\n\r\n`;
    
    const bodyStart = Buffer.from(body, 'utf-8');
    
    let endParts = `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-1\r\n`;
    
    // Add language hint if provided (improves accuracy + speed)
    if (language && ['en', 'ur', 'hi'].includes(language)) {
      endParts += `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="language"\r\n\r\n` +
        `${language}\r\n`;
    }
    
    endParts += `--${boundary}--\r\n`;
    const bodyEnd = Buffer.from(endParts, 'utf-8');
    
    const fullBody = Buffer.concat([bodyStart, audioBuffer, bodyEnd]);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length.toString()
      },
      body: fullBody
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Whisper error:', data.error);
      return res.status(500).json({ error: data.error.message });
    }

    res.status(200).json({ text: data.text });
  } catch (err) {
    console.error('Whisper handler error:', err);
    res.status(500).json({ error: err.message });
  }
}
