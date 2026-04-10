const { Resend } = require('resend');

async function sendEmail({ to, subject, html, text }) {
  // Check if Resend API key is configured
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  RESEND_API_KEY not configured. Email sending is disabled.');
    console.warn('   Registration will succeed but verification email will not be sent.');
    console.warn('   To enable emails, set RESEND_API_KEY in your .env file');
    return { id: 'mock-email-id', skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: 'EngageMind <onboarding@resend.dev>', 
      to,
      subject,
      html,
      text,
    });

    console.log('✅ Email sent successfully:', response.id);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error.message || error);
    // Don't throw - allow registration to succeed even if email fails
    // User can request email resend later
    throw error;
  }
}

module.exports = sendEmail;
