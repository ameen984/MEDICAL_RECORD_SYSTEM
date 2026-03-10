import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCreateUserMutation, useUpdateUserMutation } from '../users/usersApi';
import { useGetHospitalsQuery } from './hospitalsApi';
import type { RootState } from '../../app/store';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Building2 } from 'lucide-react';
import type { User, Hospital } from '../../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: User | null;
}

export default function UserModal({ isOpen, onClose, userToEdit }: UserModalProps) {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const { data: hospitals = [] } = useGetHospitalsQuery();
    
    // Default standard admins to have their hospitalIds injected, super_admin gets blank array.
    const initialHospitalState = currentUser?.role === 'admin' ? (currentUser?.hospitalIds || []) : []; 

    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        password?: string;
        role: 'super_admin' | 'admin' | 'doctor' | 'patient' | '';
        phone: string;
        hospitalIds: string[];
    }>({
        name: '',
        email: '',
        password: '',
        role: '',
        phone: '',
        hospitalIds: (initialHospitalState as any[]).map(h => typeof h === 'object' ? String(h._id || h.id) : String(h)),
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                password: '', // Don't populate password
                role: userToEdit.role as 'super_admin' | 'admin' | 'doctor' | 'patient',
                phone: userToEdit.phone || '',
                hospitalIds: (userToEdit.hospitalIds || []).map(h => typeof h === 'object' && h !== null ? String((h as any)._id || (h as any).id) : String(h)).filter(Boolean) as string[],
            });
        } else {
            setFormData({ name: '', email: '', password: '', role: '', phone: '', hospitalIds: (initialHospitalState as any[]).map(h => typeof h === 'object' ? String(h._id || h.id) : String(h)) });
        }
    }, [userToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.role) {
            alert('Please select a role');
            return;
        }

        try {
            if (userToEdit) {
                // Edit Mode
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    phone: formData.phone,
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                
                if ((formData.role === 'doctor' || formData.role === 'admin') && formData.hospitalIds.length > 0) {
                    updateData.hospitalIds = formData.hospitalIds;
                }

                await updateUser({
                    id: userToEdit.id || userToEdit._id,
                    data: updateData,
                }).unwrap();
            } else {
                // Create Mode
                if (!formData.password) {
                    alert('Password is required for new users');
                    return;
                }
                
                const createData: any = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    phone: formData.phone,
                };
                
                if ((formData.role === 'doctor' || formData.role === 'admin') && formData.hospitalIds.length > 0) {
                    createData.hospitalIds = formData.hospitalIds;
                }

                await createUser(createData).unwrap();
            }
            
            onClose();
        } catch (error) {
            console.error('Failed to save user:', error);
            alert('Failed to save user');
        }
    };

    const isLoading = isCreating || isUpdating;
    const isEditMode = !!userToEdit;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isEditMode ? "Edit User" : "Create New User"} 
            maxWidth="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    label={isEditMode ? "Password (leave blank to keep unchanged)" : "Password"}
                    type="password"
                    required={!isEditMode}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                />

                <Select
                    label="Role"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
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
                    <div className="space-y-2">
                        <label className="block text-[13px] font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            Facility Assignments (Select multiple)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                            {hospitals.map((h: Hospital) => {
                                const idStr = String(h._id || h.id);
                                const isSelected = formData.hospitalIds.includes(idStr);
                                return (
                                    <label key={idStr} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-200 hover:border-gray-300 hover:bg-white'}`}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, hospitalIds: [...formData.hospitalIds, idStr] });
                                                } else {
                                                    setFormData({ ...formData, hospitalIds: formData.hospitalIds.filter(id => id !== idStr) });
                                                }
                                            }}
                                        />
                                        <span className="text-sm font-medium">{h.name}</span>
                                    </label>
                                );
                            })}
                        </div>
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
                        disabled={isLoading || !formData.name || !formData.email || (!isEditMode && !formData.password)}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
