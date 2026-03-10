import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { useCreateRecordMutation } from '../records/recordsApi';
import { ArrowLeft, Save, CheckCircle, Plus, Trash2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

interface PrescriptionInput {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export default function AddMedicalRecord() {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: patients } = useGetPatientsQuery();
    const [createRecord, { isLoading }] = useCreateRecordMutation();

    const [formData, setFormData] = useState({
        patientId: '',
        diagnosis: '',
        treatment: '',
        notes: '',
        nextFollowUp: '',
    });
    const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([]);
    const [isSuccess, setIsSuccess] = useState(false);

    const addPrescription = () => {
        if (prescriptions.length < 10) {
            setPrescriptions([...prescriptions, { medicationName: '', dosage: '', frequency: '', duration: '' }]);
        }
    };

    const removePrescription = (index: number) => {
        setPrescriptions(prescriptions.filter((_, i) => i !== index));
    };

    const updatePrescription = (index: number, field: keyof PrescriptionInput, value: string) => {
        const nextPrescriptions = [...prescriptions];
        nextPrescriptions[index][field] = value;
        setPrescriptions(nextPrescriptions);
    };

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
                prescriptions: prescriptions.filter((p) => p.medicationName.trim() !== '')
            }).unwrap();

            setIsSuccess(true);
            setTimeout(() => {
                navigate('/patients');
            }, 1800);
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
                {isSuccess ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900">Medical Record Saved!</h4>
                        <p className="text-gray-500">Redirecting to patient list...</p>
                    </div>
                ) : (
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
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Prescriptions
                            </label>
                            <button
                                type="button"
                                onClick={addPrescription}
                                className="inline-flex items-center px-3 py-1.5 border border-primary-200 text-sm font-medium rounded-md text-primary-700 bg-primary-50 hover:bg-primary-100"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Medication
                            </button>
                        </div>
                        
                        {prescriptions.length === 0 ? (
                            <div className="text-sm text-gray-500 italic py-2 border rounded-md border-dashed border-gray-300 text-center">
                                No prescriptions added. Click "Add Medication" above.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {prescriptions.map((px, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="grid font-medium text-gray-900 w-full grid-cols-1 sm:grid-cols-4 gap-4">
                                            <Input
                                                label="Medication"
                                                required
                                                placeholder="e.g. Amoxicillin"
                                                value={px.medicationName}
                                                onChange={(e) => updatePrescription(idx, 'medicationName', e.target.value)}
                                            />
                                            <Input
                                                label="Dosage"
                                                required
                                                placeholder="e.g. 500mg"
                                                value={px.dosage}
                                                onChange={(e) => updatePrescription(idx, 'dosage', e.target.value)}
                                            />
                                            <Input
                                                label="Frequency"
                                                required
                                                placeholder="e.g. Twice daily"
                                                value={px.frequency}
                                                onChange={(e) => updatePrescription(idx, 'frequency', e.target.value)}
                                            />
                                            <Input
                                                label="Duration"
                                                required
                                                placeholder="e.g. 7 days"
                                                value={px.duration}
                                                onChange={(e) => updatePrescription(idx, 'duration', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePrescription(idx)}
                                            className="p-2 mt-6 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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

                    <Input
                        label="Next Follow-up Date"
                        type="date"
                        value={formData.nextFollowUp}
                        onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                        placeholder="Select next visit date"
                    />

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
                )}
            </div>
        </div>
    );
}
