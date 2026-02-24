import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center px-6">
                <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="h-12 w-12 text-red-600" />
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Denied</h2>
                
                <p className="text-gray-600 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>
                
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Home className="h-5 w-5 mr-2" />
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
