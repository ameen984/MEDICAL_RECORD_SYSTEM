import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email using SMTP credentials from environment variables.
 * Falls back to logging the email content to the terminal when SMTP is not configured.
 */
export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, FROM_NAME } = process.env;

    // If SMTP is not configured, fall back to console output (dev mode)
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log('\n[EMAIL - no SMTP configured, printing to terminal]');
        console.log(`  To:      ${to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body:\n${html.replace(/<[^>]+>/g, '')}\n`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        connectionTimeout: 10_000,  // 10 s to establish TCP connection
        greetingTimeout:   8_000,   // 8 s for SMTP EHLO greeting
        socketTimeout:     15_000,  // 15 s of inactivity before aborting
    });

    await transporter.sendMail({
        from: `"${FROM_NAME || 'MediCare'}" <${FROM_EMAIL || SMTP_USER}>`,
        to,
        subject,
        html,
    });
};
