import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email.
 *
 * Priority:
 *   1. Resend API  (set RESEND_API_KEY) — works on all cloud providers, recommended for production
 *   2. SMTP        (set SMTP_HOST + SMTP_USER + SMTP_PASS) — works locally / self-hosted
 *   3. Console log — dev fallback when neither is configured
 */
export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
    const { RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, FROM_NAME } = process.env;

    const fromName = FROM_NAME || 'MediCare';
    const fromEmail = FROM_EMAIL || SMTP_USER || 'noreply@medicare.app';
    const from = `${fromName} <${fromEmail}>`;

    // ── 1. Resend (preferred for production) ─────────────────────────────────
    if (RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);
        const { error } = await resend.emails.send({ from, to, subject, html });
        if (error) {
            console.error('[EMAIL] Resend error:', error);
            throw new Error(error.message);
        }
        console.log(`[EMAIL] Sent via Resend to ${to}`);
        return;
    }

    // ── 2. SMTP (works locally, blocked by most cloud providers for Gmail) ───
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        const port = Number(SMTP_PORT) || 465;
        const secure = port === 465;

        console.log(`[EMAIL] Attempting SMTP to ${to} via ${SMTP_HOST}:${port}`);

        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port,
            secure,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10_000,
            greetingTimeout:   8_000,
            socketTimeout:     15_000,
        });

        try {
            const info = await transporter.sendMail({ from, to, subject, html });
            console.log(`[EMAIL] Sent via SMTP. MessageId: ${info.messageId}`);
        } catch (err: any) {
            console.error('[EMAIL] SMTP failed:', err.message);
            throw err;
        }
        return;
    }

    // ── 3. Dev fallback ───────────────────────────────────────────────────────
    console.log('\n[EMAIL - no provider configured, printing to terminal]');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${html.replace(/<[^>]+>/g, '')}\n`);
};
