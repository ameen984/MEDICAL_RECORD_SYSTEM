
import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { useUploadReportMutation } from '../reports/reportsApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface UploadReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadReportModal({ isOpen, onClose }: UploadReportModalProps) {
    const { user } = useSelector((state: RootState) => state.auth);
    const [uploadReport, { isLoading }] = useUploadReportMutation();
    
    const [formData, setFormData] = useState({
        title: '',
        type: 'lab' as 'lab' | 'scan' | 'prescription' | 'other',
    });
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        if (!user?.id) {
             setError('User session not found');
             return;
        }

        try {
            await uploadReport({
                patientId: user.id, // Patient uploading for themselves
                title: formData.title,
                type: formData.type,
                file: file,
            }).unwrap();
            
            onClose();
            // Reset form
            setFormData({ title: '', type: 'lab' });
            setFile(null);
        } catch (err: any) {
            setError(err.data?.message || 'Failed to upload report');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Transparent backdrop that handles closing */}
            <div 
                className="fixed inset-0 bg-transparent transition-opacity" 
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal Panel */}
            <div 
                className="relative bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900">
                        Upload Report
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-1 rounded-full focus:outline-none transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                required
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="Report Name"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            >
                                <option value="lab">Lab Result</option>
                                <option value="scan">Scan/Imaging</option>
                                <option value="prescription">Prescription</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                File
                            </label>
                            {!file ? (
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors cursor-pointer relative">
                                    <div className="space-y-1 text-center">
                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                        <div className="text-sm text-gray-600">
                                            <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setFile(e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-1 flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                                    <div className="flex items-center">
                                        <FileText className="h-5 w-5 text-primary-500 mr-2" />
                                        <span className="text-sm text-gray-700 truncate max-w-[200px] font-medium">{file.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Uploading...' : 'Upload'}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
