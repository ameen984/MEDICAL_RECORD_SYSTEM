import { useState, useEffect } from 'react';
import { useCreateUserMutation, useUpdateUserMutation } from '../users/usersApi';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import type { User } from '../../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: User | null;
}

export default function UserModal({ isOpen, onClose, userToEdit }: UserModalProps) {
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '' as 'doctor' | 'patient' | '',
        phone: '',
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name,
                email: userToEdit.email,
                password: '', // Don't populate password
                role: userToEdit.role as 'doctor' | 'patient', // Admin role might not be editable here or needs handling? Admin can create other admins? Schema says role: doctor | patient.
// CreateUserRequest allows doctor|patient.
// Admin userToEdit?
                phone: userToEdit.phone || '',
            });
        } else {
            setFormData({ name: '', email: '', password: '', role: '', phone: '' });
        }
    }, [userToEdit, isOpen]); // Reset when opening/closing or changing user

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

                await updateUser({
                    id: userToEdit.id,
                    data: updateData,
                }).unwrap();
            } else {
                // Create Mode
                if (!formData.password) {
                    alert('Password is required for new users');
                    return;
                }
                await createUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    phone: formData.phone,
                }).unwrap();
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
            maxWidth="lg"
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
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'doctor' | 'patient' })}
                    options={[
                        { value: 'doctor', label: 'Doctor' },
                        { value: 'patient', label: 'Patient' },
                        // Maybe add Admin if editing admin?
                    ]}
                    // Disable role change if needed, or handle Admin editing Admin
                />

                <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                />

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                    >
                        {isLoading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
