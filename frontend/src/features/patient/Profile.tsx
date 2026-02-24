import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { User, Heart, AlertCircle, Save, Loader2, Pencil, X, CheckCircle2, XCircle, AlertTriangle, Cigarette, Wine, ShieldAlert } from 'lucide-react';
import Input from '../../components/ui/Input';
import { useGetPatientProfileQuery, useUpdatePatientProfileMutation, useChangePasswordMutation } from './patientApi';

type EditingSection = 'personal' | 'medical' | 'emergency' | null;

export default function Profile() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: profileData, isLoading: isProfileLoading } = useGetPatientProfileQuery(user?.id ?? '', {
        skip: !user?.id,
    });
    const [updateProfile, { isLoading: isUpdating }] = useUpdatePatientProfileMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

    const [editingSection, setEditingSection] = useState<EditingSection>(null);
    const [savedSection, setSavedSection] = useState<EditingSection>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        bloodType: '',
        allergies: '',
        emergencyContact: '',
        emergencyPhone: '',
        height: '',
        weight: '',
        chronicConditions: '',
        habits: {
            smoking: 'No' as 'Yes' | 'No' | 'Occasional' | 'Former',
            alcohol: 'No' as 'Yes' | 'No' | 'Occasional' | 'Former',
        },
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // Load data when fetched
    useEffect(() => {
        if (profileData?.data) {
            const data = profileData.data;
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                bloodType: data.bloodType || '',
                allergies: data.allergies || '',
                emergencyContact: data.emergencyContact || '',
                emergencyPhone: data.emergencyPhone || '',
                height: data.height || '',
                weight: data.weight || '',
                chronicConditions: data.chronicConditions || '',
                habits: {
                    smoking: data.habits?.smoking || 'No',
                    alcohol: data.habits?.alcohol || 'No',
                },
            });
        }
    }, [profileData]);

    const handleEdit = (section: EditingSection) => {
        setEditingSection(section);
        setMessage({ type: '', text: '' });
    };

    const handleCancel = () => {
        // Reset form data to original profile data
        if (profileData?.data) {
            const data = profileData.data;
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                bloodType: data.bloodType || '',
                allergies: data.allergies || '',
                emergencyContact: data.emergencyContact || '',
                emergencyPhone: data.emergencyPhone || '',
                height: data.height || '',
                weight: data.weight || '',
                chronicConditions: data.chronicConditions || '',
                habits: {
                    smoking: data.habits?.smoking || 'No',
                    alcohol: data.habits?.alcohol || 'No',
                },
            });
        }
        setEditingSection(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        const currentSection = editingSection;

        try {
            await updateProfile({
                id: user?.id ?? '',
                data: formData,
            }).unwrap();
            
            setEditingSection(null);
            setSavedSection(currentSection);
            setTimeout(() => setSavedSection(null), 2000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.data?.message || 'Failed to update profile' });
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        try {
            await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            }).unwrap();
            
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err.data?.message || 'Failed to change password' });
        }
    };

    if (isProfileLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    const isEditing = (section: EditingSection) => editingSection === section;

    // Reusable section header with pencil icon
    const SectionHeader = ({ icon, title, section, color }: { icon: React.ReactNode; title: string; section: EditingSection; color: string }) => (
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                {icon}
                {title}
                {savedSection === section && (
                    <span
                        className="ml-3 flex items-center gap-1 text-sm font-medium text-green-600"
                        style={{ animation: 'slideIn 0.3s ease-out' }}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Saved!
                    </span>
                )}
            </h3>
            {!isEditing(section) ? (
                <button
                    type="button"
                    onClick={() => handleEdit(section)}
                    className={`p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:${color} transition-colors`}
                    title={`Edit ${title}`}
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
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form={`form-${section}`}
                        disabled={isUpdating}
                        className="flex items-center px-3 py-1.5 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                        Save
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Premium Header Container */}
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h2>
                        <p className="mt-2 text-lg text-gray-500 font-medium">Manage your clinical profile and security clearance.</p>
                    </div>
                    <div className="flex -space-x-3">
                        <div className="h-14 w-14 rounded-2xl bg-white border-4 border-primary-50 shadow-sm flex items-center justify-center text-primary-600 font-black text-xl">
                            {user?.name?.charAt(0)}
                        </div>
                    </div>
                </div>
            </div>

            {message.text && message.type === 'error' && (
                <div
                    className="flex items-center gap-3 p-5 rounded-2xl shadow-sm border bg-red-50 text-red-700 border-red-100 animate-in fade-in slide-in-from-top-4 duration-300"
                >
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {/* Personal Information */}
                <div className="group bg-white shadow-sm rounded-3xl border border-gray-100 p-8 hover:border-primary-100 transition-all">
                    <SectionHeader
                        icon={<User className="h-6 w-6 mr-3 text-primary-600" />}
                        title="Identity & Contact"
                        section="personal"
                        color="text-primary-600"
                    />
                    <form id="form-personal" onSubmit={handleSave}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Full Legal Name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                disabled={!isEditing('personal')}
                            />
                            <Input
                                label="System Email (Read-only)"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled
                            />
                            <Input
                                label="Primary Phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing('personal')}
                            />
                            <Input
                                label="Residential Address"
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={!isEditing('personal')}
                            />
                        </div>
                    </form>
                </div>

                {/* Medical Information */}
                <div className="group bg-white shadow-sm rounded-3xl border border-gray-100 p-8 hover:border-red-100 transition-all">
                    <SectionHeader
                        icon={<ShieldAlert className="h-6 w-6 mr-3 text-red-500" />}
                        title="Biometric & Medical Data"
                        section="medical"
                        color="text-red-600"
                    />
                    <form id="form-medical" onSubmit={handleSave} className="space-y-6">
                        {/* Biometric Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Blood Type</label>
                                <select
                                    className={`block w-full border rounded-xl shadow-sm py-3 px-4 text-sm font-bold ${isEditing('medical') ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500' : 'border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                                    value={formData.bloodType}
                                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                                    disabled={!isEditing('medical')}
                                >
                                    <option value="">N/A</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <Input
                                label="Height (cm)"
                                type="number"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                placeholder="175"
                                disabled={!isEditing('medical')}
                            />
                            <Input
                                label="Weight (kg)"
                                type="number"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                placeholder="70"
                                disabled={!isEditing('medical')}
                            />
                        </div>

                        {/* Medical Overview Cards — same design as dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Allergies */}
                            <div className="group/card p-5 bg-red-50/50 rounded-2xl border border-red-100/50 hover:border-red-200 transition-all">
                                <div className="flex items-center mb-3">
                                    <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center mr-3">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">Allergies</h4>
                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-200 text-red-700 font-black uppercase">Doctor Only</span>
                                    </div>
                                </div>
                                {formData.allergies ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.allergies.split(',').map((allergy: string, i: number) => (
                                            <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                {allergy.trim()}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No allergies recorded</p>
                                )}
                            </div>

                            {/* Chronic Conditions */}
                            <div className="group/card p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 hover:border-amber-200 transition-all">
                                <div className="flex items-center mb-3">
                                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center mr-3">
                                        <Heart className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">Chronic Conditions</h4>
                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-700 font-black uppercase">Doctor Only</span>
                                    </div>
                                </div>
                                {formData.chronicConditions ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.chronicConditions.split(',').map((condition: string, i: number) => (
                                            <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                {condition.trim()}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No chronic conditions recorded</p>
                                )}
                            </div>

                            {/* Smoking */}
                            <div className="group/card p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3">
                                            <Cigarette className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Smoking</h4>
                                            <p className="text-xs text-gray-500">Tobacco usage</p>
                                        </div>
                                    </div>
                                    {isEditing('medical') ? (
                                        <select
                                            className="border border-gray-300 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.habits.smoking}
                                            onChange={(e) => setFormData({ ...formData, habits: { ...formData.habits, smoking: e.target.value as any } })}
                                        >
                                            <option value="No">Non-Smoker</option>
                                            <option value="Yes">Regular Smoker</option>
                                            <option value="Occasional">Social Smoker</option>
                                            <option value="Former">Former Smoker</option>
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                            formData.habits.smoking === 'No'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : formData.habits.smoking === 'Yes'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {formData.habits.smoking || 'Not set'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Alcohol */}
                            <div className="group/card p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3">
                                            <Wine className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Alcohol</h4>
                                            <p className="text-xs text-gray-500">Drinking habits</p>
                                        </div>
                                    </div>
                                    {isEditing('medical') ? (
                                        <select
                                            className="border border-gray-300 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.habits.alcohol}
                                            onChange={(e) => setFormData({ ...formData, habits: { ...formData.habits, alcohol: e.target.value as any } })}
                                        >
                                            <option value="No">Abstinent</option>
                                            <option value="Yes">Regular</option>
                                            <option value="Occasional">Social</option>
                                            <option value="Former">Former</option>
                                        </select>
                                    ) : (
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                            formData.habits.alcohol === 'No'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : formData.habits.alcohol === 'Yes'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {formData.habits.alcohol || 'Not set'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Emergency Contact */}
                <div className="group bg-white shadow-sm rounded-3xl border border-gray-100 p-8 hover:border-orange-100 transition-all">
                    <SectionHeader
                        icon={<AlertCircle className="h-6 w-6 mr-3 text-orange-600" />}
                        title="Emergency Protocol"
                        section="emergency"
                        color="text-orange-600"
                    />
                    <form id="form-emergency" onSubmit={handleSave}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Protocol Contact Name"
                                type="text"
                                value={formData.emergencyContact}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                disabled={!isEditing('emergency')}
                            />
                            <Input
                                label="Protocol Contact Phone"
                                type="tel"
                                value={formData.emergencyPhone}
                                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                disabled={!isEditing('emergency')}
                            />
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white shadow-sm rounded-3xl border border-gray-100 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center text-white">
                            <Save className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Security & Credentials</h3>
                    </div>
                    
                    {passwordMessage.text && (
                        <div
                            className={`flex items-center gap-3 p-5 rounded-2xl mb-8 font-bold ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                        >
                            {passwordMessage.type === 'error' ? (
                                <XCircle className="h-5 w-5 flex-shrink-0" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                            )}
                            <span className="text-sm">{passwordMessage.text}</span>
                        </div>
                    )}
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input
                                label="Current Credential"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                            />
                            <Input
                                label="New Security Code"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                            />
                            <Input
                                label="Verify Security Code"
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
                                Update Credentials
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
