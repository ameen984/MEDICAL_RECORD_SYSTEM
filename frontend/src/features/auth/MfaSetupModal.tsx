import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import { ShieldCheck, ShieldOff, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMfaEnabled?: boolean;
  onStatusChange?: () => void; // called after enable/disable to refresh user state
}

export default function MfaSetupModal({ isOpen, onClose, isMfaEnabled = false, onStatusChange }: MfaSetupModalProps) {
  const [step, setStep] = useState<'intro' | 'scan' | 'success' | 'disableConfirm' | 'disabled'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authState = useSelector((state: RootState) => state.auth);
  const jwt = authState.token;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleClose = () => {
    // Reset state when closing
    setStep('intro');
    setQrCode('');
    setMfaSecret('');
    setToken('');
    setError(null);
    onClose();
  };

  const handleSetup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // FIX: was missing method: 'POST', causing a GET request which fails
      const res = await fetch(`${apiBase}/auth/mfa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qrCodeUrl);
        setMfaSecret(data.data.secret);
        setStep('scan');
      } else {
        setError(data.message || 'Failed to setup MFA');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
        onStatusChange?.();
      } else {
        setError(data.message || 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/auth/mfa/disable`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.success) {
        setStep('disabled');
        onStatusChange?.();
      } else {
        setError(data.message || 'Failed to disable MFA');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (isMfaEnabled && step === 'intro') return 'Manage Two-Factor Authentication';
    if (step === 'disableConfirm') return 'Disable Two-Factor Authentication';
    if (step === 'success' || step === 'disabled') return 'Authentication Updated';
    return 'Setup Two-Factor Authentication';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
      <div className="p-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── INTRO STEP ─── */}
        {step === 'intro' && !isMfaEnabled && (
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="text-gray-600 text-sm">
              Enhance your account security by requiring a verification code from your Authenticator app when you sign in.
            </p>
            <button
              onClick={handleSetup}
              disabled={isLoading}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Start Setup'}
            </button>
          </div>
        )}

        {/* ─── MFA ALREADY ENABLED ─── */}
        {step === 'intro' && isMfaEnabled && (
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="text-green-700 font-medium">Two-Factor Authentication is Active</p>
            <p className="text-gray-500 text-sm">Your account is protected with a TOTP authenticator app.</p>
            <button
              onClick={() => setStep('disableConfirm')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <ShieldOff className="h-4 w-4" />
              Disable Two-Factor Authentication
            </button>
          </div>
        )}

        {/* ─── SCAN QR STEP ─── */}
        {step === 'scan' && (
          <form className="space-y-4" onSubmit={handleVerify}>
            <p className="text-sm text-gray-600 text-center">
              Scan this QR code with your Authenticator App (e.g., Google Authenticator, Authy), then enter the 6-digit code below.
            </p>
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              {qrCode ? (
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 animate-pulse bg-gray-200 rounded-lg" />
              )}
            </div>
            <details className="text-center">
              <summary className="text-xs text-gray-400 cursor-pointer select-none">Can't scan? Enter key manually</summary>
              <p className="text-xs font-mono text-gray-600 mt-1 break-all bg-gray-50 p-2 rounded border border-gray-100">{mfaSecret}</p>
            </details>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit Code</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="• • • • • •"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || token.length < 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify & Enable'}
            </button>
          </form>
        )}

        {/* ─── SUCCESS STEP ─── */}
        {step === 'success' && (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-green-700 font-semibold text-lg">MFA Successfully Enabled!</p>
            <p className="text-gray-500 text-sm">
              You'll now be asked for a verification code each time you sign in.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* ─── DISABLE CONFIRM ─── */}
        {step === 'disableConfirm' && (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto h-16 w-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
              <ShieldOff className="h-8 w-8" />
            </div>
            <p className="text-gray-800 font-semibold">Are you sure?</p>
            <p className="text-gray-500 text-sm">
              Disabling two-factor authentication will make your account less secure. You can always re-enable it later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('intro'); setError(null); }}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                disabled={isLoading}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : 'Yes, Disable'}
              </button>
            </div>
          </div>
        )}

        {/* ─── DISABLED SUCCESS ─── */}
        {step === 'disabled' && (
          <div className="text-center space-y-4 py-2">
            <div className="mx-auto h-16 w-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
              <ShieldOff className="h-8 w-8" />
            </div>
            <p className="text-gray-700 font-semibold">MFA Disabled</p>
            <p className="text-gray-500 text-sm">
              Two-factor authentication has been removed from your account.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
