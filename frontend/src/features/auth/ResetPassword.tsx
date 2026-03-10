import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useResetPasswordMutation } from './authApi';
import Input from '../../components/ui/Input';
import { Activity, KeyRound, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        try {
            await resetPassword({ token, password }).unwrap();
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Failed to reset password:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
                    Create New Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Your new password must be securely chosen and different from your old one.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Password Reset Complete!</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    Your password has been successfully reset. Redirecting you to login...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {(error || passwordError) && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                    <p className="text-sm text-red-700">
                                        {passwordError || (error as any)?.data?.message || 'Failed to reset password.'}
                                    </p>
                                </div>
                            )}

                            <div>
                                <Input
                                    label="New Password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !password || !confirmPassword}
                                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 transition-colors"
                                >
                                    {isLoading ? (
                                        'Saving...'
                                    ) : (
                                        <>
                                            <KeyRound className="w-4 h-4 mr-2" />
                                            Reset Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {!isSuccess && (
                        <div className="mt-6 text-center">
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500">
                                Cancel and return to login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
