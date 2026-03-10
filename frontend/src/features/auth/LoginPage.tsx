import React, { useState, useEffect } from 'react';
import { useLoginMutation } from './authApi';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from './authSlice';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../app/store.ts';
import { Lock, Mail, Activity, ShieldAlert } from 'lucide-react';
import Loader from '../../components/Loader.tsx';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const payload = requiresMfa ? { identifier, password, mfaToken } : { identifier, password };
      const response = await login(payload).unwrap();
      
      if (response.requiresMfa) {
          setRequiresMfa(true);
      } else {
          dispatch(setCredentials(response));
          navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to login:', err);
      setErrorMsg(err?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  // Clear error message when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    setter(e.target.value);
    if (errorMsg) setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 from-primary-50 to-white bg-gradient-to-br">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
             <Activity className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your medical dashboard
          </p>
        </div>

        {/* Dynamic Error Alert with Shake Animation */}
        {errorMsg && (
          <div className="animate-shake flex items-center gap-3 p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative mb-4">
              <label htmlFor="identifier" className="sr-only">
                Email or phone number
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Email or phone number"
                value={identifier}
                onChange={(e) => handleInputChange(e, setIdentifier)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => handleInputChange(e, setPassword)}
              />
            </div>
            {requiresMfa && (
            <div className="relative mt-4">
              <label htmlFor="mfaToken" className="sr-only">
                Authenticator Code
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-primary-400" />
              </div>
              <input
                id="mfaToken"
                name="mfaToken"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-primary-300 placeholder-primary-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-primary-50"
                placeholder="6-digit Authenticator Code"
                value={mfaToken}
                onChange={(e) => handleInputChange(e, setMfaToken)}
              />
            </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-primary-500 group-hover:text-primary-400 transition-colors" />
              </span>
              {isLoading ? <Loader size="sm" color="white" /> : 'Sign in'}
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
            >
              Forgot password?
            </button>
            <div>
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
              >
                Register here
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
