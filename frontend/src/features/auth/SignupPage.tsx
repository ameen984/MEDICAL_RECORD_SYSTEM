import React, { useState, useEffect } from 'react';
import { useRegisterMutation, useGoogleAuthMutation, useSendEmailOtpMutation, useVerifyEmailOtpMutation } from './authApi';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { RootState } from '../../app/store.ts';
import { Lock, Mail, Phone, User as UserIcon, Activity, ShieldAlert, MessageSquare } from 'lucide-react';
import Loader from '../../components/Loader.tsx';

type Tab = 'password' | 'email-otp';

const SignupPage = () => {
  const [tab, setTab] = useState<Tab>('password');

  // Password tab state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Email OTP tab state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [register, { isLoading }] = useRegisterMutation();
  const [googleAuth] = useGoogleAuthMutation();
  const [sendOtp, { isLoading: isSendingOtp }] = useSendEmailOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyEmailOtpMutation();

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

  const handleGoogleSuccess = async (credential: string) => {
    clearError();
    try {
      const data = await googleAuth(credential).unwrap();
      dispatch(setCredentials(data)); navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Google sign-up failed. Please try again.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    if (!otpName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    try { await sendOtp({ email: otpEmail, name: otpName.trim() }).unwrap(); setOtpSent(true); }
    catch (err: any) { setErrorMsg(err?.data?.message || 'Failed to send OTP. Please try again.'); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    try {
      const data = await verifyOtp({ email: otpEmail, otp }).unwrap();
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
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(cr) => handleGoogleSuccess(cr.credential!)}
            onError={() => setErrorMsg('Google sign-up failed. Please try again.')}
            width={408}
            size="large"
            shape="rectangular"
            theme="outline"
            text="signup_with"
            useOneTap={false}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or register with</span></div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
          {(['password', 'email-otp'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); clearError(); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'password'
                ? <span className="flex items-center justify-center gap-1.5"><Lock className="h-3.5 w-3.5" />Email / Password</span>
                : <span className="flex items-center justify-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email OTP</span>}
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

        {tab === 'email-otp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            {!otpSent && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Full Name" value={otpName} onChange={e => { setOtpName(e.target.value); clearError(); }} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="email" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                placeholder="Enter your email address" value={otpEmail} disabled={otpSent}
                onChange={e => { setOtpEmail(e.target.value); clearError(); }} />
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
                Use a different email
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
