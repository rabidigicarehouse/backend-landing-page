import nodemailer from 'nodemailer';

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:4174',
  'http://127.0.0.1:4174',
  'http://localhost:4175',
  'http://127.0.0.1:4175',
];

const leadFormats = {
  design: {
    label: 'Design',
    heading: 'New Design Lead',
    accent: '#FF4D00',
  },
  'ai-automation': {
    label: 'AI/Automation',
    heading: 'New AI & Automation Lead',
    accent: '#29D3FF',
  },
  development: {
    label: 'Development',
    heading: 'New Development Lead',
    accent: '#4F8CFF',
  },
  default: {
    label: 'General',
    heading: 'New Shared Landing Page Lead',
    accent: '#4F8CFF',
  },
};

export const getAllowedOrigins = () => (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins);

export const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function processLeadSubmission(body) {
  const {
    user_name,
    user_email,
    user_phone,
    service,
    budget,
    message,
    recaptcha_token,
    landing_page,
  } = body || {};

  const cleanName = user_name?.trim();
  const cleanEmail = user_email?.trim();
  const cleanPhone = user_phone?.trim();
  const cleanMessage = message?.trim();
  const cleanService = service?.trim();
  const cleanBudget = budget?.trim();

  if (!cleanName || !cleanEmail || !cleanPhone || !cleanMessage || !recaptcha_token) {
    return {
      status: 400,
      payload: { error: 'Missing required fields, phone number, or recaptcha token.' },
    };
  }

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha_token}`;
  const recaptchaRes = await fetch(verifyUrl, { method: 'POST' });
  const recaptchaData = await recaptchaRes.json();

  if (!recaptchaData.success) {
    console.error('ReCaptcha Failure:', recaptchaData);
    return {
      status: 400,
      payload: { error: 'ReCaptcha verification failed.' },
    };
  }

  const leadFormat = leadFormats[landing_page] || leadFormats.default;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${cleanName}" <${process.env.SMTP_USER}>`,
    replyTo: cleanEmail,
    to: process.env.SMTP_TO,
    subject: `New ${leadFormat.label} Lead: ${cleanService || 'General'} from ${cleanName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="border-bottom: 2px solid ${leadFormat.accent}; padding-bottom: 10px;">${leadFormat.heading}</h2>
        <p><strong>Landing Page:</strong> ${leadFormat.label}</p>
        <p><strong>Name:</strong> ${cleanName}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Phone:</strong> ${cleanPhone}</p>
        ${cleanService ? `<p><strong>Service Requested:</strong> ${cleanService}</p>` : ''}
        <p><strong>Target Budget:</strong> ${cleanBudget || 'Not specified'}</p>
        <h3 style="margin-top: 30px;">Project Details:</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px;">
          ${cleanMessage.replace(/\n/g, '<br/>')}
        </div>
      </div>
    `,
  });

  return {
    status: 200,
    payload: { success: true, message: 'Message sent successfully.' },
  };
}
