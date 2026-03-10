import { useState, useEffect } from 'react';
import { useCreateHospitalMutation, useUpdateHospitalMutation } from './hospitalsApi';
import Modal from '../../components/ui/Modal';
import type { Hospital } from '../../types';

interface HospitalModalProps {
    isOpen: boolean;
    onClose: () => void;
    hospitalToEdit?: Hospital | null;
}

export default function HospitalModal({ isOpen, onClose, hospitalToEdit }: HospitalModalProps) {
    const [createHospital, { isLoading: isCreating }] = useCreateHospitalMutation();
    const [updateHospital, { isLoading: isUpdating }] = useUpdateHospitalMutation();

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        contactEmail: '',
        status: 'active' as 'active' | 'inactive',
    });
    
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && hospitalToEdit) {
            setFormData({
                name: hospitalToEdit.name,
                address: hospitalToEdit.address || '',
                phone: hospitalToEdit.phone || '',
                contactEmail: hospitalToEdit.contactEmail || '',
                status: hospitalToEdit.status,
            });
            setError(null);
        } else if (isOpen) {
            setFormData({
                name: '',
                address: '',
                phone: '',
                contactEmail: '',
                status: 'active',
            });
            setError(null);
        }
    }, [isOpen, hospitalToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (hospitalToEdit) {
                const id = hospitalToEdit.id || hospitalToEdit._id;
                await updateHospital({ id: id as string, data: formData }).unwrap();
            } else {
                await createHospital(formData).unwrap();
            }
            onClose();
        } catch (err: any) {
            console.error('Failed to save hospital:', err);
            setError(err?.data?.message || 'Action failed. Please try again.');
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={hospitalToEdit ? 'Update Facility' : 'Register New Facility'}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Facility Name *</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-900"
                        placeholder="e.g. Seattle General Hospital"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Contact</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                            placeholder="(555) 000-0000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Support Email</label>
                        <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                            placeholder="admin@hospital.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Physical Address</label>
                    <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm resize-none h-24"
                        placeholder="Full street address..."
                    />
                </div>

                {hospitalToEdit && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Operation Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-900"
                        >
                            <option value="active">Active (Permits Logins)</option>
                            <option value="inactive">Inactive (Suspended node)</option>
                        </select>
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !formData.name}
                        className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : hospitalToEdit ? 'Update Facility' : 'Register Facility'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
