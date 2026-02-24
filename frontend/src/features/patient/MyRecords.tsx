import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetRecordsQuery } from '../records/recordsApi';
import { FileText, Download } from 'lucide-react';
import Loader from '../../components/Loader';

export default function MyRecords() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: records, isLoading } = useGetRecordsQuery({ patientId: user?.id });

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Medical Records</h2>
                <p className="mt-1 text-gray-500">View your complete medical history</p>
            </div>

            {/* Timeline View */}
            <div className="bg-white shadow rounded-lg p-6">
                {records && records.length > 0 ? (
                    <div className="space-y-6">
                        {records.slice().reverse().map((record, index) => (
                            <div key={record.id} className="relative">
                                {/* Timeline line */}
                                {index !== records.length - 1 && (
                                    <div className="absolute left-3 top-12 -bottom-6 w-0.5 bg-gray-200"></div>
                                )}
                                
                                <div className="flex items-start space-x-4">
                                    {/* Timeline dot */}
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                        <FileText className="h-3 w-3 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">{record.diagnosis}</h3>
                                                    <span className="text-sm text-gray-500">{record.date}</span>
                                                </div>
                                                
                                                <div className="mt-3 space-y-2">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Treatment</p>
                                                        <p className="text-sm text-gray-700 mt-1">{record.treatment}</p>
                                                    </div>
                                                    
                                                    {record.prescriptions && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase">Prescriptions</p>
                                                            <p className="text-sm text-gray-700 mt-1">{record.prescriptions}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {record.notes && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                                                            <p className="text-sm text-gray-700 mt-1 italic">{record.notes}</p>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="pt-2">
                                                        <p className="text-xs text-gray-400">Doctor: {record.doctorName}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="ml-4 p-2 text-gray-400 hover:text-primary-600 transition-colors">
                                                <Download className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
                        <p className="mt-1 text-sm text-gray-500">Your medical records will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
