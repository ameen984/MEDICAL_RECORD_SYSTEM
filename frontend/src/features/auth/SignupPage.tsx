import React, { useState, useEffect } from 'react';
import { useRegisterMutation, useGoogleAuthMutation, useSendPhoneOtpMutation, useVerifyPhoneOtpMutation } from './authApi';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import type { RootState } from '../../app/store.ts';
import { Lock, Mail, Phone, User as UserIcon, Activity, ShieldAlert, MessageSquare } from 'lucide-react';
import Loader from '../../components/Loader.tsx';

type Tab = 'password' | 'phone';

const SignupPage = () => {
  const [tab, setTab] = useState<Tab>('password');

  // Password tab state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Phone OTP tab state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [register, { isLoading }] = useRegisterMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
  const [sendOtp, { isLoading: isSendingOtp }] = useSendPhoneOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyPhoneOtpMutation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);
  const clearError = () => setErrorMsg(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    try {
      const payload: any = { name, password, role: 'patient' };
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();
      const userData = await register(payload).unwrap();
      dispatch(setCredentials(userData));
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      clearError();
      try {
        const data = await googleAuth(tokenResponse.access_token).unwrap();
        dispatch(setCredentials(data)); navigate('/dashboard');
      } catch (err: any) { setErrorMsg(err?.data?.message || 'Google sign-up failed'); }
    },
    onError: () => setErrorMsg('Google sign-up was cancelled or failed'),
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    if (!otpName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    try { await sendOtp(otpPhone).unwrap(); setOtpSent(true); }
    catch (err: any) { setErrorMsg(err?.data?.message || 'Failed to send OTP. Check the phone number.'); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    try {
      const data = await verifyOtp({ phone: otpPhone, otp }).unwrap();
      dispatch(setCredentials(data)); navigate('/dashboard');
    } catch (err: any) { setErrorMsg(err?.data?.message || 'Invalid or expired OTP.'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div className="max-w-md w-full space-y-6 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign up to access your medical records</p>
        </div>

        {/* Google Sign-Up */}
        <button type="button" onClick={() => handleGoogleLogin()} disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
          {isGoogleLoading ? <Loader size="sm" /> : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or register with</span></div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
          {(['password', 'phone'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); clearError(); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'password'
                ? <span className="flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email / Password</span>
                : <span className="flex items-center justify-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone OTP</span>}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" /><p>{errorMsg}</p>
          </div>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="text" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Full Name" value={name} onChange={e => { setName(e.target.value); clearError(); }} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="tel" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Phone Number (optional)" value={phone} onChange={e => { setPhone(e.target.value); clearError(); }} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="email" className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Email Address (optional)" value={email} onChange={e => { setEmail(e.target.value); clearError(); }} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="password" required minLength={6} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Password (minimum 6 characters)" value={password} onChange={e => { setPassword(e.target.value); clearError(); }} />
            </div>
            <p className="text-xs text-gray-400 text-center">Provide at least one of: email or phone number</p>
            <button type="submit" disabled={isLoading || (!email.trim() && !phone.trim())}
              className="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center">
              {isLoading ? <Loader size="sm" color="white" /> : 'Create Account'}
            </button>
          </form>
        )}

        {tab === 'phone' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            {!otpSent && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Full Name" value={otpName} onChange={e => { setOtpName(e.target.value); clearError(); }} />
              </div>
            )}
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="tel" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                placeholder="+1234567890 (with country code)" value={otpPhone} disabled={otpSent}
                onChange={e => { setOtpPhone(e.target.value); clearError(); }} />
            </div>
            {otpSent && (
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
                <input type="text" required maxLength={6}
                  className="w-full pl-10 pr-3 py-3 border border-primary-300 rounded-lg text-sm bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-widest font-mono text-center text-lg"
                  placeholder="Enter 6-digit OTP" value={otp} onChange={e => { setOtp(e.target.value); clearError(); }} />
              </div>
            )}
            <button type="submit" disabled={isSendingOtp || isVerifyingOtp}
              className="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center">
              {(isSendingOtp || isVerifyingOtp) ? <Loader size="sm" color="white" /> : otpSent ? 'Verify & Create Account' : 'Send OTP'}
            </button>
            {otpSent && (
              <button type="button" onClick={() => { setOtpSent(false); setOtp(''); clearError(); }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                Change number
              </button>
            )}
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className="font-medium text-primary-600 hover:text-primary-500">Sign in here</button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
