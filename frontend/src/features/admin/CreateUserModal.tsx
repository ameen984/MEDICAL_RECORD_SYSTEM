import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useCreateUserMutation } from '../users/usersApi';
import { useGetHospitalsQuery } from './hospitalsApi';
import type { RootState } from '../../app/store';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Building2 } from 'lucide-react';
import type { Hospital } from '../../types';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [createUser, { isLoading }] = useCreateUserMutation();
    const { data: hospitals = [] } = useGetHospitalsQuery();
    
    // Default standard admins to have their hospitalId injected, super_admin gets blank string default.
    const initialHospitalState = currentUser?.role === 'admin' ? String(currentUser?.hospitalId || '') : ''; 

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient',
        phone: '',
        hospitalId: initialHospitalState,
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role as any,
                phone: formData.phone,
            } as any;
            
            if ((formData.role === 'doctor' || formData.role === 'admin') && formData.hospitalId) {
                payload.hospitalId = formData.hospitalId;
            }

            await createUser(payload).unwrap();
            
            // Reset and close
            setFormData({ name: '', email: '', password: '', role: 'patient', phone: '', hospitalId: initialHospitalState });
            onClose();
        } catch (err: any) {
            console.error('Failed to create user:', err);
            setError(err?.data?.message || 'Failed to create user');
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Create New User" 
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <Input
                    label="Full Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                />

                <Input
                    label="Email Address"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                />

                <Input
                    label="Password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter short or temporary password"
                />

                <Select
                    label="Role"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'super_admin' | 'admin' | 'doctor' | 'patient' })}
                    options={[
                        { value: 'patient', label: 'Patient' },
                        { value: 'doctor', label: 'Doctor' },
                        ...(currentUser?.role === 'super_admin' ? [
                            { value: 'admin', label: 'Facility Admin' },
                            { value: 'super_admin', label: 'Network Super Admin' }
                        ] : [])
                    ]}
                />

                {(formData.role === 'doctor' || formData.role === 'admin') && currentUser?.role === 'super_admin' && (
                    <div className="space-y-1">
                        <label className="block text-[13px] font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            Facility Assignment
                        </label>
                        <select
                            value={formData.hospitalId}
                            onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm bg-white"
                        >
                            <option value="">Select a Network Hospital</option>
                            {hospitals.map((h: Hospital) => (
                                <option key={h._id || h.id} value={h._id || h.id}>
                                    {h.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                />

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-50 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-bold transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !formData.name || !formData.email || !formData.password}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
