import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getAllowedOrigins, processLeadSubmission } from './contactHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['POST'],
}));

app.use(express.json());

app.post('/api/contact', async (req, res) => {
  try {
    const result = await processLeadSubmission(req.body);
    res.status(result.status).json(result.payload);
  } catch (error) {
    console.error('Server Mail Error:', error);
    res.status(500).json({ error: 'Internal Server Error while sending email.' });
  }
});

app.listen(PORT, () => {
  console.log(`Shared landing page backend running on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Nodemailer hooked up to SMTP: ${process.env.SMTP_USER || 'MISSING .ENV CONFIG'}`);
});
