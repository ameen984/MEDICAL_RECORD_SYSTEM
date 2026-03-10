import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetReportsQuery } from '../reports/reportsApi';
import { FileText, Download, Filter } from 'lucide-react';
import Select from '../../components/ui/Select';
import Loader from '../../components/Loader';
import UploadReportModal from './UploadReportModal';
import { Plus } from 'lucide-react';

export default function MyReports() {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const { data: reports, isLoading } = useGetReportsQuery({ patientId: user?.id });
    const [filterType, setFilterType] = useState<string>('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    const handleDownload = async (reportId: string, fileName: string) => {
        try {
            setIsDownloading(reportId);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/${reportId}/download`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download report', error);
            alert('Failed to download report');
        } finally {
            setIsDownloading(null);
        }
    };

    if (isLoading) {
        return <Loader />;
    }

    const filteredReports = filterType
        ? reports?.filter(r => r.type === filterType)
        : reports;

    return (
        <div className="space-y-6">
            <UploadReportModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
            />
            
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Medical Reports</h2>
                    <p className="mt-1 text-gray-500">View and download your medical reports</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Upload Report
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center space-x-4">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <Select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        options={[
                            { value: '', label: 'All Reports' },
                            { value: 'lab', label: 'Lab Results' },
                            { value: 'scan', label: 'Scans/Imaging' },
                            { value: 'prescription', label: 'Prescriptions' },
                            { value: 'other', label: 'Other' },
                        ]}
                        className="max-w-xs"
                    />
                </div>
            </div>

            {/* Reports Grid */}
            <div className="bg-white shadow rounded-lg p-6">
                {filteredReports && filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredReports.map(report => (
                            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {report.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 capitalize">
                                                {report.type}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(report.uploadDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(report.id, report.fileName);
                                        }}
                                        disabled={isDownloading === report.id}
                                        className="ml-2 p-1.5 text-gray-400 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        title="Download Report"
                                    >
                                        <Download className={`h-4 w-4 ${isDownloading === report.id ? 'animate-pulse' : ''}`} />
                                    </button>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-xs text-gray-500">
                                            <span className="font-medium">Uploaded by:</span> {report.uploadedBy?.name || report.doctorName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            <span className="font-medium">Facility:</span> {report.hospitalId?.name || report.hospitalName || 'Unknown Facility'}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate mt-2">{report.fileName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filterType ? 'Try changing the filter' : 'Your medical reports will appear here'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
