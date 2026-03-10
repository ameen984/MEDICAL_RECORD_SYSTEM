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

    const port = Number(SMTP_PORT) || 465;
    const secure = port === 465;

    console.log(`[EMAIL] Attempting to send to ${to} via ${SMTP_HOST}:${port} (secure=${secure})`);

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        tls: {
            // Required on some cloud hosts where the TLS cert chain isn't fully trusted
            rejectUnauthorized: false,
        },
        connectionTimeout: 10_000,
        greetingTimeout:   8_000,
        socketTimeout:     15_000,
    });

    try {
        const info = await transporter.sendMail({
            from: `"${FROM_NAME || 'MediCare'}" <${FROM_EMAIL || SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`[EMAIL] Sent successfully. MessageId: ${info.messageId}`);
    } catch (err: any) {
        // Log the full error so it appears in Render/Railway logs
        console.error('[EMAIL] Send failed:', err.message);
        console.error('[EMAIL] SMTP config — host:', SMTP_HOST, 'port:', port, 'user:', SMTP_USER);
        throw err; // Re-throw so the controller can return a proper 500
    }
};
