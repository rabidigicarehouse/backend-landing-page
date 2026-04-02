import dotenv from 'dotenv';
import { getAllowedOrigins, processLeadSubmission } from '../contactHandler.js';

dotenv.config();

const allowedOrigins = getAllowedOrigins();

function setCorsHeaders(res, origin) {
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    setCorsHeaders(res, origin);
  } else {
    return res.status(403).json({ error: `CORS blocked for origin: ${origin}` });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await processLeadSubmission(req.body);
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Vercel Mail Error:', error);
    return res.status(500).json({ error: 'Internal Server Error while sending email.' });
  }
}
