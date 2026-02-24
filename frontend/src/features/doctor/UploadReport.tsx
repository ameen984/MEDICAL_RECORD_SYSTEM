import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { useUploadReportMutation } from '../reports/reportsApi';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUpload from '../../components/ui/FileUpload';

export default function UploadReport() {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: patients } = useGetPatientsQuery();
    const [uploadReport, { isLoading }] = useUploadReportMutation();

    const [formData, setFormData] = useState({
        patientId: '',
        type: '' as 'lab' | 'scan' | 'prescription' | 'other' | '',
        title: '',
        file: null as File | null,
    });

    const handleFileSelect = (file: File) => {
        setFormData({ ...formData, file });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.patientId || !formData.type || !formData.file) {
            alert('Please fill all required fields and select a file');
            return;
        }

        const selectedPatient = patients?.find(p => p.id === formData.patientId);
        if (!selectedPatient || !user) return;

        try {
            await uploadReport({
                patientId: formData.patientId,
                patientName: selectedPatient.name,
                doctorId: user.id,
                doctorName: user.name,
                type: formData.type,
                title: formData.title,
                file: formData.file,
            }).unwrap();

            alert('Report uploaded successfully!');
            navigate('/patients');
        } catch (error) {
            console.error('Failed to upload report:', error);
            alert('Failed to upload report');
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
                    <h2 className="text-2xl font-bold text-gray-900">Upload Medical Report</h2>
                    <p className="mt-1 text-gray-500">Upload lab results, scans, or prescriptions</p>
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

                    <Select
                        label="Report Type"
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        options={[
                            { value: 'lab', label: 'Lab Results' },
                            { value: 'scan', label: 'Scan/Imaging' },
                            { value: 'prescription', label: 'Prescription' },
                            { value: 'other', label: 'Other' },
                        ]}
                    />

                    <Input
                        label="Report Title"
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="E.g., Blood Test Results - January 2024"
                    />

                    <FileUpload
                        label="Upload File"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onFileSelect={handleFileSelect}
                        maxSize={10}
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
                            <UploadIcon className="h-4 w-4 mr-2" />
                            {isLoading ? 'Uploading...' : 'Upload Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
