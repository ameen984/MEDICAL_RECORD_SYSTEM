import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { useCreateRecordMutation } from '../records/recordsApi';
import { ArrowLeft, Save } from 'lucide-react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function AddMedicalRecord() {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: patients } = useGetPatientsQuery();
    const [createRecord, { isLoading }] = useCreateRecordMutation();

    const [formData, setFormData] = useState({
        patientId: '',
        diagnosis: '',
        treatment: '',
        prescriptions: '',
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.patientId) {
            alert('Please select a patient');
            return;
        }

        const selectedPatient = patients?.find(p => p.id === formData.patientId);
        if (!selectedPatient || !user) return;

        try {
            await createRecord({
                ...formData,
            }).unwrap();

            alert('Medical record created successfully!');
            navigate('/patients');
        } catch (error) {
            console.error('Failed to create record:', error);
            alert('Failed to create medical record');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/patients')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add Medical Record</h2>
                    <p className="mt-1 text-gray-500">Create a new patient medical record</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Select
                        label="Select Patient"
                        required
                        value={formData.patientId}
                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                        options={patients?.map(p => ({ value: p.id, label: p.name })) || []}
                    />

                    <Input
                        label="Diagnosis"
                        type="text"
                        required
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                        placeholder="Enter diagnosis"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Treatment <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            value={formData.treatment}
                            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                            placeholder="Describe the treatment plan"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prescriptions
                        </label>
                        <textarea
                            value={formData.prescriptions}
                            onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
                            placeholder="List medications and dosages"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes or instructions"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/patients')}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
