import express from 'express';
import { register, login, getMe, changePassword, forgotPassword, resetPassword, setupMfa, verifyMfa, disableMfa, logoutUser, googleAuth, sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Google OAuth
router.post('/google', googleAuth);

// Phone OTP
router.post('/phone/send-otp', sendPhoneOtp);
router.post('/phone/verify-otp', verifyPhoneOtp);

// Email OTP (passwordless login)
router.post('/email/send-otp', sendEmailOtp);
router.post('/email/verify-otp', verifyEmailOtp);

router.post('/mfa/setup', protect, setupMfa);
router.post('/mfa/verify', protect, verifyMfa);
router.post('/mfa/disable', protect, disableMfa);

export default router;

