const { Resend } = require('resend');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { name, email, phone, message } = body;

  if (!name || !email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name, email, and message are required.' }) };
  }

  if (!isValidEmail(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Please provide a valid email address.' }) };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'State 48 Cleaning <hello@state48cleaning.com>',
      to: 'Jason@founditmarketing.com',
      reply_to: email,
      subject: `New Quote Request from ${escapeHtml(name)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#1C2D6E;margin-bottom:4px;">New Contact Form Submission</h2>
          <p style="color:#94a0b8;font-size:14px;margin-bottom:24px;">Submitted via state48cleaning.com</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e6f0;color:#4a5270;width:120px;font-size:14px;font-weight:600;">Name</td><td style="padding:10px 0;border-bottom:1px solid #e2e6f0;color:#0d1030;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #e2e6f0;color:#4a5270;font-size:14px;font-weight:600;">Email</td><td style="padding:10px 0;border-bottom:1px solid #e2e6f0;color:#0d1030;">${escapeHtml(email)}</td></tr>
            ${phone ? `<tr><td style="padding:10px 0;border-bottom:1px solid #e2e6f0;color:#4a5270;font-size:14px;font-weight:600;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #e2e6f0;color:#0d1030;">${escapeHtml(phone)}</td></tr>` : ''}
            <tr><td style="padding:10px 0;color:#4a5270;font-size:14px;font-weight:600;vertical-align:top;">Message</td><td style="padding:10px 0;color:#0d1030;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>
          </table>
          <p style="margin-top:24px;font-size:13px;color:#94a0b8;">Reply to this email to respond directly to ${escapeHtml(name)}.</p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Resend error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email. Please try again.' }),
    };
  }
};
