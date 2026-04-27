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

const leadFormat = {
  label: 'Design',
  heading: 'New Design Lead',
  accent: '#FDCF73',
  ink: '#003467',
  source: 'The Design Hands',
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

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${cleanName}" <${process.env.SMTP_USER}>`,
    replyTo: cleanEmail,
    to: process.env.SMTP_TO,
    subject: `New ${leadFormat.label} Lead: ${cleanService || 'General'} from ${cleanName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: ${leadFormat.ink}; background-color: #fffaf0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 40px rgba(0, 52, 103, 0.12); border: 1px solid rgba(0, 52, 103, 0.12); }
          .header { background: linear-gradient(135deg, ${leadFormat.accent}, #ffe7a6); padding: 32px 40px; color: ${leadFormat.ink}; text-align: left; border-bottom: 1px solid rgba(0, 52, 103, 0.08); }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; }
          .header p { margin: 4px 0 0 0; opacity: 0.9; font-size: 14px; font-weight: 600; }
          .content { padding: 40px; }
          .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${leadFormat.ink}; margin-bottom: 16px; border-bottom: 1px solid rgba(0, 52, 103, 0.1); padding-bottom: 8px; }
          .grid { display: table; width: 100%; margin-bottom: 32px; }
          .grid-row { display: table-row; }
          .grid-label { display: table-cell; width: 30%; padding: 8px 0; font-weight: 700; color: ${leadFormat.ink}; font-size: 14px; }
          .grid-value { display: table-cell; padding: 8px 0; color: ${leadFormat.ink}; font-size: 14px; }
          .message-box { background-color: #fff7df; border-radius: 12px; padding: 24px; border: 1px solid rgba(253, 207, 115, 0.55); font-style: italic; color: ${leadFormat.ink}; }
          .footer { background-color: #fffaf0; padding: 24px 40px; text-align: center; border-top: 1px solid rgba(0, 52, 103, 0.1); }
          .footer p { margin: 0; font-size: 12px; color: rgba(0, 52, 103, 0.72); }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: ${leadFormat.accent}; color: ${leadFormat.ink}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${leadFormat.source}</h1>
            <p>${leadFormat.heading}</p>
          </div>
          <div class="content">
            <div class="section-title">Client Information</div>
            <div class="grid">
              <div class="grid-row">
                <div class="grid-label">Name</div>
                <div class="grid-value">${cleanName}</div>
              </div>
              <div class="grid-row">
                <div class="grid-label">Email</div>
                <div class="grid-value"><a href="mailto:${cleanEmail}" style="color: ${leadFormat.ink}; text-decoration: none; font-weight: 600;">${cleanEmail}</a></div>
              </div>
              <div class="grid-row">
                <div class="grid-label">Phone</div>
                <div class="grid-value"><a href="tel:${cleanPhone}" style="color: inherit; text-decoration: none;">${cleanPhone}</a></div>
              </div>
            </div>

            <div class="section-title">Project Details</div>
            <div class="grid">
              <div class="grid-row">
                <div class="grid-label">Service</div>
                <div class="grid-value"><span class="badge">${cleanService || 'General Inquiry'}</span></div>
              </div>
              <div class="grid-row">
                <div class="grid-label">Budget</div>
                <div class="grid-value">${cleanBudget || 'Not specified'}</div>
              </div>
            </div>

            <div class="section-title">Project Brief</div>
            <div class="message-box">
              ${cleanMessage.replace(/\n/g, '<br/>')}
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${leadFormat.source}. All rights reserved.</p>
            <p>Sent from ${leadFormat.label} Landing Page</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return {
    status: 200,
    payload: { success: true, message: 'Message sent successfully.' },
  };
}
