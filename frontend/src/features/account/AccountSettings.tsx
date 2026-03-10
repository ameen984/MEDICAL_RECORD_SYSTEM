import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../app/store';
import { User, Save, Loader2, Pencil, X, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import Input from '../../components/ui/Input';
import MfaSetupModal from '../auth/MfaSetupModal';
import { useUpdateUserMutation } from '../users/usersApi';
import { useChangePasswordMutation } from '../patient/patientApi';
import { setCredentials } from '../auth/authSlice';

type EditingSection = 'personal' | null;

export default function AccountSettings() {
    const dispatch = useDispatch();
    const { user, token } = useSelector((state: RootState) => state.auth);

    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

    const [editingSection, setEditingSection] = useState<EditingSection>(null);
    const [savedSection, setSavedSection] = useState<EditingSection>(null);
    const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    const roleLabel: Record<string, string> = {
        doctor: 'Physician',
        admin: 'Facility Administrator',
        super_admin: 'System Administrator',
    };

    const handleEdit = () => {
        setFormData({ name: user?.name || '', phone: user?.phone || '' });
        setEditingSection('personal');
        setMessage({ type: '', text: '' });
    };

    const handleCancel = () => {
        setFormData({ name: user?.name || '', phone: user?.phone || '' });
        setEditingSection(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            const updated = await updateUser({ id: user?.id ?? '', data: { name: formData.name, phone: formData.phone } }).unwrap();
            // Refresh auth state so navbar/sidebar reflect new name immediately
            dispatch(setCredentials({ user: { ...user!, ...updated }, token: token! }));
            setEditingSection(null);
            setSavedSection('personal');
            setTimeout(() => setSavedSection(null), 2000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.data?.message || 'Failed to update profile' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        try {
            await changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }).unwrap();
            setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.data?.message || 'Failed to change password' });
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h2>
                        <p className="mt-2 text-base text-gray-500 font-medium">
                            {roleLabel[user?.role ?? ''] ?? 'Staff'} — Manage your identity and security.
                        </p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-white border-4 border-primary-50 shadow-sm flex items-center justify-center text-primary-600 font-black text-xl flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            {message.text && message.type === 'error' && (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-50 text-red-700 border border-red-100">
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-bold text-sm">{message.text}</span>
                </div>
            )}

            {/* Identity & Contact */}
            <div className="bg-white shadow-sm rounded-3xl border border-gray-100 p-8 hover:border-primary-100 transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <User className="h-5 w-5 mr-3 text-primary-600" />
                        Identity & Contact
                        {savedSection === 'personal' && (
                            <span className="ml-3 flex items-center gap-1 text-sm font-medium text-green-600">
                                <CheckCircle2 className="h-4 w-4" /> Saved
                            </span>
                        )}
                    </h3>
                    {editingSection !== 'personal' ? (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary-600 transition-colors"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-3.5 w-3.5 mr-1" /> Cancel
                            </button>
                            <button
                                type="submit"
                                form="form-personal"
                                disabled={isUpdating}
                                className="flex items-center px-3 py-1.5 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                                Save
                            </button>
                        </div>
                    )}
                </div>
                <form id="form-personal" onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Full Name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            disabled={editingSection !== 'personal'}
                        />
                        <Input
                            label="Email (Read-only)"
                            type="email"
                            value={user?.email || ''}
                            onChange={() => {}}
                            disabled
                        />
                        <Input
                            label="Phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={editingSection !== 'personal'}
                        />
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                            <div className="block w-full border border-gray-100 bg-gray-50 rounded-xl py-3 px-4 text-sm font-bold text-gray-500 cursor-not-allowed">
                                {roleLabel[user?.role ?? ''] ?? user?.role}
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Multi-Factor Authentication */}
            <div className="bg-white shadow-sm rounded-3xl border border-gray-100 p-8 hover:border-blue-100 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Multi-Factor Authentication</h3>
                    {user?.isMfaEnabled ? (
                        <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Active</span>
                    ) : (
                        <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">Not Enabled</span>
                    )}
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    {user?.isMfaEnabled
                        ? 'Your account is protected with an authenticator app.'
                        : 'Add an extra layer of security to your account with a TOTP authenticator app.'}
                </p>
                <button
                    onClick={() => setIsMfaModalOpen(true)}
                    className={`inline-flex items-center px-6 py-2.5 font-bold rounded-xl transition-colors ${
                        user?.isMfaEnabled
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {user?.isMfaEnabled ? 'Manage Authenticator App' : 'Setup Authenticator App'}
                </button>
            </div>

            {/* Change Password */}
            <div className="bg-white shadow-sm rounded-3xl border border-gray-100 p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                        <Save className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
                </div>

                {passwordMessage.text && (
                    <div className={`flex items-center gap-3 p-5 rounded-2xl mb-6 font-bold ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {passwordMessage.type === 'error'
                            ? <XCircle className="h-5 w-5 flex-shrink-0" />
                            : <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
                        <span className="text-sm">{passwordMessage.text}</span>
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            label="Current Password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            required
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="inline-flex items-center px-8 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {isChangingPassword ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            <MfaSetupModal
                isOpen={isMfaModalOpen}
                onClose={() => setIsMfaModalOpen(false)}
                isMfaEnabled={user?.isMfaEnabled ?? false}
                onStatusChange={() => {}}
            />
        </div>
    );
}
