import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetRecordsQuery } from '../records/recordsApi';
import { FileText, Download, CalendarClock } from 'lucide-react';
import Loader from '../../components/Loader';

const fmtDate = (d: any): string => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function MyRecords() {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const { data: records, isLoading } = useGetRecordsQuery({ patientId: user?.id });

    const handleDownload = async (reportId: string, fileName: string) => {
        const authToken = token || localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/${reportId}/download`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (!response.ok) return;
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };

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
                                                    <span className="text-sm text-gray-500">{fmtDate(record.date)}</span>
                                                </div>

                                                <div className="mt-3 space-y-2">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase">Treatment</p>
                                                        <p className="text-sm text-gray-700 mt-1">{record.treatment}</p>
                                                    </div>

                                                    {record.prescriptions && Array.isArray(record.prescriptions) && record.prescriptions.length > 0 && (
                                                        <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Prescribed Medication</p>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm text-left">
                                                                    <thead>
                                                                        <tr className="border-b border-blue-200 text-blue-900 pb-2">
                                                                            <th className="font-semibold pr-2">Medication</th>
                                                                            <th className="font-semibold px-2">Dosage</th>
                                                                            <th className="font-semibold px-2">Frequency</th>
                                                                            <th className="font-semibold pl-2">Duration</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {record.prescriptions.map((px: any, i: number) => (
                                                                            <tr key={i} className="border-b border-blue-100/50 last:border-0 text-blue-800 font-medium">
                                                                                <td className="py-1.5 pr-2">{px.medicationName}</td>
                                                                                <td className="py-1.5 px-2">{px.dosage}</td>
                                                                                <td className="py-1.5 px-2">{px.frequency}</td>
                                                                                <td className="py-1.5 pl-2">{px.duration}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {record.notes && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
                                                            <p className="text-sm text-gray-700 mt-1 italic">{record.notes}</p>
                                                        </div>
                                                    )}

                                                    {/* Next Follow-up */}
                                                    {record.nextFollowUp && fmtDate(record.nextFollowUp) && (
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg w-fit">
                                                            <CalendarClock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                                            <span className="text-xs font-bold text-amber-800">
                                                                Next Follow-up: {fmtDate(record.nextFollowUp)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="pt-3 border-t border-gray-100 flex flex-col space-y-1">
                                                        <p className="text-xs text-gray-500">
                                                            <span className="font-medium">Physician:</span> {record.doctorId?.name || record.doctorName || 'Unknown Doctor'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            <span className="font-medium">Facility:</span> {record.hospitalId?.name || record.hospitalName || 'Unknown Facility'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDownload(record.id, `record-${record.id}.pdf`)}
                                                className="ml-4 p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                                title="Download record"
                                            >
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
