import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from './authApi';
import Input from '../../components/ui/Input';
import { Activity, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await forgotPassword(email).unwrap();
            setIsSubmitted(true);
        } catch (err) {
            console.error('Failed to send reset email:', err);
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
                    {isSubmitted ? 'Check your email' : 'Reset your password'}
                </h2>
                {!isSubmitted && (
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
                    {isSubmitted ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="mt-2 text-sm text-gray-500">
                                    We've sent password reset instructions to <strong>{email}</strong>
                                </p>
                            </div>
                            <p className="text-xs text-gray-400 mt-4 italic">
                                Note: For local development, check your terminal for the simulated token link!
                            </p>
                            <Link to="/login" className="mt-6 w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                                Return to login
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                    <p className="text-sm text-red-700">
                                        {(error as any)?.data?.message || 'Failed to send reset link. Please try again.'}
                                    </p>
                                </div>
                            )}

                            <div>
                                <Input
                                    label="Email address"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 transition-colors"
                                >
                                    {isLoading ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Reset Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                    
                    {!isSubmitted && (
                        <div className="mt-6 text-center">
                            <Link to="/login" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500">
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
