import { Response } from 'express';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import User from '../models/User';
import Patient from '../models/Patient';
import TokenBlacklist from '../models/TokenBlacklist';
import { AuthRequest } from '../middleware/auth';
import { createActivityLog } from './activityController';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// Startup guard — fail fast if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

// Generate JWT Token
const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_EXPIRE || '24h') as any,
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either an email or a phone number',
            });
        }

        // Check if user exists by email OR phone
        const query = [];
        if (email) query.push({ email });
        if (phone) query.push({ phone });

        const userExists = await User.findOne({ $or: query });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or phone number',
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'patient',
            phone,
        });

        // If user is a patient, create patient profile
        if (user.role === 'patient') {
            await Patient.create({ userId: user._id });
        }

        const token = generateToken(user._id.toString());

        // Log signup
        await createActivityLog({
            user: user._id,
            userName: user.name,
            hospitalId: user.hospitalIds?.[0] || null,
            action: 'SIGNUP',
            details: `New ${user.role} account created: ${user.email || user.phone}`
        });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    hospitalIds: user.hospitalIds,
                    isMfaEnabled: user.isMfaEnabled,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response) => {
    try {
        const { identifier, password } = req.body; // Can be email or phone

        // Validate identifier & password
        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email or phone number and password',
            });
        }

        // Check for user by email OR phone
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // --- MFA Check ---
        if (user.isMfaEnabled && user.mfaSecret) {
            const { mfaToken } = req.body;
            if (!mfaToken) {
                return res.status(200).json({
                    success: true,
                    requiresMfa: true,
                    message: 'MFA token required',
                    data: { userId: user._id, requiresMfa: true }
                });
            } else {
                const speakeasy = require('speakeasy');
                const isVerified = speakeasy.totp.verify({
                    secret: user.mfaSecret,
                    encoding: 'base32',
                    token: mfaToken,
                    window: 2  // ±60s tolerance for clock drift
                });
                if (!isVerified) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid MFA token'
                    });
                }
            }
        }
        // -----------------

        const token = generateToken(user._id.toString());

        // Log login
        await createActivityLog({
            user: user._id,
            userName: user.name,
            hospitalId: user.hospitalIds?.[0] || null,
            action: 'LOGIN',
            details: `User logged in using ${identifier}`
        });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    hospitalIds: user.hospitalIds,
                    isMfaEnabled: user.isMfaEnabled,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?._id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        // Get user with password
        const user = await User.findById(req.user?._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Set new password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'There is no user with that email',
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        try {
            await sendEmail({
                to: user.email!,
                subject: 'MediCare — Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4f46e5;">Password Reset Request</h2>
                        <p>Hi ${user.name},</p>
                        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                        <p style="margin: 32px 0;">
                            <a href="${resetUrl}"
                               style="background-color: #4f46e5; color: white; padding: 12px 24px;
                                      text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Reset My Password
                            </a>
                        </p>
                        <p>Or copy this link into your browser:</p>
                        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
                        <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
                            This link expires in 10 minutes. If you did not request a password reset, you can safely ignore this email.
                        </p>
                    </div>
                `,
            });
        } catch (emailError: any) {
            // Email delivery failed — clear the token so the DB doesn't accumulate stale entries
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            console.error('[FORGOT-PASSWORD] Email send failed:', emailError.message);
            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. Please check your email configuration or try again later.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password reset email sent',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req: AuthRequest, res: Response) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }

        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Setup MFA
// @route   POST /api/auth/mfa/setup
// @access  Private
export const setupMfa = async (req: AuthRequest, res: Response) => {
    try {
        // Use req.user._id from the middleware (IUser uses _id)
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const secret = speakeasy.generateSecret({
            length: 20,
            name: `MediCare:${user.email || user.phone || user.name}`,
            issuer: 'MediCare'
        });

        // Use updateOne to avoid triggering the password pre-save hook
        await User.updateOne({ _id: userId }, { $set: { mfaSecret: secret.base32 } });

        const otpauthUrl = secret.otpauth_url || `otpauth://totp/MediCare:${encodeURIComponent(user.email || user.name)}?secret=${secret.base32}&issuer=MediCare`;
        const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

        console.log(`[MFA-SETUP] User ${userId} enrolled MFA successfully`);

        res.status(200).json({
            success: true,
            data: {
                secret: secret.base32,
                qrCodeUrl
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// @desc    Verify MFA
// @route   POST /api/auth/mfa/verify
// @access  Private
export const verifyMfa = async (req: AuthRequest, res: Response) => {
    try {
        // Coerce token to string — JSON may send it as a number in some clients
        const token = String(req.body.token || '').trim();
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

        // Fresh DB read without password to avoid stale data
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.mfaSecret) return res.status(400).json({ success: false, message: 'MFA not setup' });

        const isVerified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 4  // ±2 minutes to handle any clock drift
        });


        if (isVerified) {
            // Use updateOne to avoid password re-hash side effect
            await User.updateOne({ _id: userId }, { $set: { isMfaEnabled: true } });
            return res.status(200).json({ success: true, message: 'MFA enabled successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid token' });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// @desc    Disable MFA
// @route   POST /api/auth/mfa/disable
// @access  Private
export const disableMfa = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?._id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (!user.isMfaEnabled) {
            return res.status(400).json({ success: false, message: 'MFA is not enabled' });
        }

        await User.updateOne({ _id: req.user?._id }, { $set: { isMfaEnabled: false, mfaSecret: undefined } });

        return res.status(200).json({ success: true, message: 'MFA disabled successfully' });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// @desc    Logout — blacklist current token server-side
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req: AuthRequest, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.decode(token) as { exp?: number } | null;
            const expiresAt = decoded?.exp
                ? new Date(decoded.exp * 1000)
                : new Date(Date.now() + 24 * 60 * 60 * 1000);

            await TokenBlacklist.create({ token, expiresAt });
        }

        await createActivityLog({
            user: req.user!._id,
            userName: req.user!.name,
            hospitalId: req.user!.hospitalIds?.[0] || null,
            action: 'LOGOUT',
            details: `User logged out`,
        });

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Google OAuth
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Sign in / sign up with Google access token
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: AuthRequest, res: Response) => {
    try {
        const { idToken } = req.body; // idToken is actually an access_token from useGoogleLogin
        if (!idToken) return res.status(400).json({ success: false, message: 'Google token required' });

        // Fetch user info from Google using the access token
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!googleRes.ok) {
            return res.status(400).json({ success: false, message: 'Invalid Google token' });
        }

        const payload = await googleRes.json() as { sub: string; email: string; name: string; email_verified: boolean };
        if (!payload.email) {
            return res.status(400).json({ success: false, message: 'Could not retrieve email from Google' });
        }

        const { sub: googleId, email, name, email_verified } = payload;

        // Find existing user by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Link Google ID if signing in via email match for the first time
            if (!user.googleId) {
                await User.updateOne({ _id: user._id }, { googleId, emailVerified: !!email_verified });
                user.googleId = googleId;
                user.emailVerified = !!email_verified;
            }
        } else {
            // New user — auto-register as patient
            user = await User.create({
                name: name || email!.split('@')[0],
                email,
                googleId,
                emailVerified: !!email_verified,
                role: 'patient',
            });
            await Patient.create({ userId: user._id });
            await createActivityLog({
                user: user._id,
                userName: user.name,
                hospitalId: null,
                action: 'SIGNUP',
                details: `New patient account via Google: ${email}`,
            });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account has been suspended' });
        }

        const token = generateToken(user._id.toString());

        await createActivityLog({
            user: user._id,
            userName: user.name,
            hospitalId: user.hospitalIds?.[0] || null,
            action: 'LOGIN',
            details: `User logged in via Google`,
        });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    hospitalIds: user.hospitalIds,
                    isMfaEnabled: user.isMfaEnabled,
                    emailVerified: user.emailVerified,
                    phoneVerified: user.phoneVerified,
                },
                token,
            },
        });
    } catch (error: any) {
        console.error('[GOOGLE-AUTH]', error.message);
        res.status(500).json({ success: false, message: 'Google authentication failed' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Email OTP (passwordless login)
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Send OTP to email address
// @route   POST /api/auth/email/send-otp
// @access  Public
export const sendEmailOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email address required' });

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            if (!name || !name.trim()) {
                // Login context — user must already exist
                return res.status(404).json({ success: false, message: 'No account found with this email. Please register first.' });
            }
            // Signup context — create account, then send OTP
            user = await User.create({ name: name.trim(), email: normalizedEmail, role: 'patient' });
            await Patient.create({ userId: user._id });
            await createActivityLog({
                user: user._id,
                userName: user.name,
                hospitalId: null,
                action: 'SIGNUP',
                details: `New patient account created via Email OTP: ${normalizedEmail}`,
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await User.updateOne({ _id: user._id }, { emailOtp: otpHash, emailOtpExpire: otpExpire });

        await sendEmail({
            to: user.email!,
            subject: 'MediCare — Your Login Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Your One-Time Login Code</h2>
                    <p>Hi ${user.name},</p>
                    <p>Use the code below to sign in to MediCare. It expires in <strong>10 minutes</strong>.</p>
                    <div style="margin: 32px 0; text-align: center;">
                        <span style="display: inline-block; background: #f3f4f6; border: 2px dashed #4f46e5;
                                     padding: 16px 40px; border-radius: 12px; font-size: 36px;
                                     font-weight: bold; letter-spacing: 10px; color: #1e1b4b;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #9ca3af; font-size: 13px;">If you did not request this code, you can safely ignore this email.</p>
                </div>
            `,
        });

        console.log(`[EMAIL-OTP] Sent to ${email}`);
        res.status(200).json({ success: true, message: 'OTP sent to your email address' });
    } catch (error: any) {
        console.error('[EMAIL-OTP]', error.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
};

// @desc    Verify email OTP and log user in
// @route   POST /api/auth/email/verify-otp
// @access  Public
export const verifyEmailOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            emailOtp: otpHash,
            emailOtpExpire: { $gt: new Date() },
        }).select('+emailOtp');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await User.updateOne(
            { _id: user._id },
            { emailVerified: true, emailOtp: undefined, emailOtpExpire: undefined }
        );

        const token = generateToken(user._id.toString());

        await createActivityLog({
            user: user._id,
            userName: user.name,
            hospitalId: user.hospitalIds?.[0] || null,
            action: 'LOGIN',
            details: `User logged in via Email OTP`,
        });

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    hospitalIds: user.hospitalIds,
                    isMfaEnabled: user.isMfaEnabled,
                    emailVerified: true,
                    phoneVerified: user.phoneVerified,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phone OTP verification
// ─────────────────────────────────────────────────────────────────────────────

const getTwilioClient = () => {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
    return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

// @desc    Send OTP to phone number
// @route   POST /api/auth/phone/send-otp
// @access  Public
export const sendPhoneOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Upsert: update existing user or create a placeholder
        await User.findOneAndUpdate(
            { phone },
            { phoneOtp: otpHash, phoneOtpExpire: otpExpire },
            { upsert: false }
        );

        const client = getTwilioClient();
        if (client) {
            await client.messages.create({
                body: `Your MediCare verification code is: ${otp}. Valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER!,
                to: phone,
            });
            console.log(`[PHONE-OTP] Sent to ${phone}`);
        } else {
            // Dev fallback — print to terminal
            console.log(`[PHONE-OTP DEV] Code for ${phone}: ${otp}`);
        }

        res.status(200).json({ success: true, message: 'OTP sent to your phone number' });
    } catch (error: any) {
        console.error('[PHONE-OTP]', error.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

// @desc    Verify phone OTP and mark phone as verified
// @route   POST /api/auth/phone/verify-otp
// @access  Public
export const verifyPhoneOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({
            phone,
            phoneOtp: otpHash,
            phoneOtpExpire: { $gt: new Date() },
        }).select('+phoneOtp');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await User.updateOne(
            { _id: user._id },
            { phoneVerified: true, phoneOtp: undefined, phoneOtpExpire: undefined }
        );

        // If user is fully registered, return a JWT
        const token = generateToken(user._id.toString());

        res.status(200).json({
            success: true,
            message: 'Phone verified successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    hospitalIds: user.hospitalIds,
                    isMfaEnabled: user.isMfaEnabled,
                    emailVerified: user.emailVerified,
                    phoneVerified: true,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

