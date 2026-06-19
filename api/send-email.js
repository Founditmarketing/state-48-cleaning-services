const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, email, service, message } = req.body;

    if (!name || (!phone && !email) || !message) {
      return res.status(400).json({
        error: 'Please provide your name, a phone number or email, and a message.',
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1C2D6E;padding:24px 32px;">
          <h1 style="color:#F5A623;margin:0;font-size:20px;letter-spacing:0.04em;">
            State 48 Cleaning — New Contact Form Submission
          </h1>
        </div>
        <div style="padding:32px;background:#f8f9fc;border:1px solid #e2e6f0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;font-weight:700;color:#1C2D6E;width:120px;vertical-align:top;">Name</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;color:#333;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;font-weight:700;color:#1C2D6E;vertical-align:top;">Phone</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;color:#333;">${phone ? escapeHtml(phone) : '<em style="color:#999;">Not provided</em>'}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;font-weight:700;color:#1C2D6E;vertical-align:top;">Email</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;color:#333;">${email ? `<a href="mailto:${escapeHtml(email)}" style="color:#C41230;">${escapeHtml(email)}</a>` : '<em style="color:#999;">Not provided</em>'}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;font-weight:700;color:#1C2D6E;vertical-align:top;">Service</td>
              <td style="padding:12px 0;border-bottom:1px solid #e2e6f0;color:#333;">${service ? escapeHtml(service) : '<em style="color:#999;">Not specified</em>'}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;font-weight:700;color:#1C2D6E;vertical-align:top;">Message</td>
              <td style="padding:12px 0;color:#333;white-space:pre-wrap;">${escapeHtml(message)}</td>
            </tr>
          </table>
        </div>
        <div style="padding:16px 32px;background:#1C2D6E;text-align:center;">
          <p style="color:#94a0b8;font-size:12px;margin:0;">Sent from the State 48 Cleaning website contact form</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'State 48 Cleaning <hello@state48cleaning.com>',
      to: ['Jason@founditmarketing.com'],
      replyTo: email || undefined,
      subject: `New Contact: ${escapeHtml(name)} — ${service || 'General Inquiry'}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }

    return res.status(200).json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
