import React, { useState, useEffect } from 'react';
import { useLoginMutation, useGoogleAuthMutation, useSendEmailOtpMutation, useVerifyEmailOtpMutation } from './authApi';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import type { RootState } from '../../app/store.ts';
import { Lock, Mail, Activity, ShieldAlert, MessageSquare } from 'lucide-react';
import Loader from '../../components/Loader.tsx';

type Tab = 'password' | 'email-otp';

const LoginPage = () => {
  const [tab, setTab] = useState<Tab>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();
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
      const payload = requiresMfa ? { identifier, password, mfaToken } : { identifier, password };
      const response = await login(payload).unwrap();
      if (response.requiresMfa) { setRequiresMfa(true); }
      else { dispatch(setCredentials(response)); navigate('/dashboard'); }
    } catch (err: any) { setErrorMsg(err?.data?.message || 'Invalid credentials. Please try again.'); }
  };

  const handleGoogleSuccess = async (credential: string) => {
    clearError();
    try {
      const data = await googleAuth(credential).unwrap();
      dispatch(setCredentials(data)); navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    try { await sendOtp({ email: otpEmail }).unwrap(); setOtpSent(true); }
    catch (err: any) { setErrorMsg(err?.data?.message || 'Failed to send OTP. Make sure this email is registered.'); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    try {
      const data = await verifyOtp({ email: otpEmail, otp }).unwrap();
      dispatch(setCredentials(data)); navigate('/dashboard');
    } catch (err: any) { setErrorMsg(err?.data?.message || 'Invalid or expired OTP'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-md w-full space-y-6 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your medical dashboard</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
          {(['password', 'email-otp'] as Tab[]).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); clearError(); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'password'
                ? <span className="flex items-center justify-center gap-1.5"><Lock className="h-3.5 w-3.5" />Password</span>
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
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="text" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Email or phone number" value={identifier} onChange={e => { setIdentifier(e.target.value); clearError(); }} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input type="password" required className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); clearError(); }} />
            </div>
            {requiresMfa && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-primary-400" />
                <input type="text" required className="w-full pl-10 pr-3 py-3 border border-primary-300 rounded-lg text-sm bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="6-digit Authenticator Code" value={mfaToken} onChange={e => { setMfaToken(e.target.value); clearError(); }} />
              </div>
            )}
            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center">
              {isLoading ? <Loader size="sm" color="white" /> : 'Sign in'}
            </button>
            <button type="button" onClick={() => navigate('/forgot-password')} className="w-full text-center text-sm text-primary-600 hover:text-primary-500">
              Forgot password?
            </button>
          </form>
        )}

        {tab === 'email-otp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
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
                  placeholder="Enter 6-digit code" value={otp} onChange={e => { setOtp(e.target.value); clearError(); }} />
                <p className="text-xs text-gray-400 text-center mt-1">Check your inbox — code expires in 10 minutes</p>
              </div>
            )}
            <button type="submit" disabled={isSendingOtp || isVerifyingOtp}
              className="w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center">
              {(isSendingOtp || isVerifyingOtp) ? <Loader size="sm" color="white" /> : otpSent ? 'Verify & Sign In' : 'Send Code'}
            </button>
            {otpSent && (
              <button type="button" onClick={() => { setOtpSent(false); setOtp(''); clearError(); }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                Use a different email
              </button>
            )}
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or sign in with</span></div>
        </div>

        {/* Google Sign-In */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(cr) => handleGoogleSuccess(cr.credential!)}
            onError={() => setErrorMsg('Google sign-in failed. Please try again.')}
            width={408}
            size="large"
            shape="rectangular"
            theme="outline"
            text="signin_with"
            useOneTap={false}
          />
        </div>

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/register')} className="font-medium text-primary-600 hover:text-primary-500">Register here</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
