import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { useGetRecordsQuery } from '../records/recordsApi';
import { useGetReportsQuery } from '../reports/reportsApi';
import { Users, FileText, Activity, AlertCircle, ClipboardList } from 'lucide-react';
import Card from '../../components/ui/Card';
import Loader from '../../components/Loader';

export default function DoctorDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: patients, isLoading: patientsLoading } = useGetPatientsQuery();
    const { data: records, isLoading: recordsLoading } = useGetRecordsQuery({});
    const { data: reports, isLoading: reportsLoading } = useGetReportsQuery({});

    if (patientsLoading || recordsLoading || reportsLoading) {
        return <Loader />;
    }

    // Helper to extract ID from potentially populated field
    const extractId = (field: any): string | null => {
        if (!field) return null;
        if (typeof field === 'string') return field;
        const id = field.id || field._id;
        return id ? String(id) : null;
    };

    const myRecords = records?.filter(r => extractId(r.doctorId) === user?.id) || [];
    
    // Date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Clinical Alerts (Patients with Allergies or Chronic Conditions)
    const criticalPatientsCount = patients?.filter(p => 
        (p.allergies && p.allergies !== 'None') || 
        (p.chronicConditions && p.chronicConditions !== 'None')
    ).length || 0;

    // Follow-up Due: Logic Refinement
    // We only care about the LATEST record for each patient. 
    // If their most recent record has a follow-up date, we track it.
    const latestRecordsMap = new Map();
    myRecords.forEach(r => {
        const pId = extractId(r.patientId);
        const existing = latestRecordsMap.get(pId);
        if (!existing || new Date(r.date) > new Date(existing.date)) {
            latestRecordsMap.set(pId, r);
        }
    });

    const followUpDueCount = Array.from(latestRecordsMap.values())
        .filter(r => r.nextFollowUp && new Date(r.nextFollowUp) <= sevenDaysFromNow)
        .length;

    // Pending Reviews (Reports from last 14 days without a consultation/record since then)
    const pendingReviewsCount = reports?.filter(report => {
        const reportDate = new Date(report.uploadDate);
        if (reportDate < fourteenDaysAgo) return false;
        
        const rPatientId = extractId(report.patientId);
        
        // Check if any record exists for this patient created AFTER this report
        const hasRecord = myRecords.some(record => 
            extractId(record.patientId) === rPatientId && 
            new Date(record.date) >= reportDate
        );
        return !hasRecord;
    }).length || 0;

    return (
        <div className="space-y-6">
            {/* Premium Header/Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                    <div className="h-16 w-16 shrink-0 z-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 font-extrabold text-2xl shadow-inner">
                        {user?.name?.charAt(0) || 'D'}
                    </div>
                    <div className="z-10">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dr. {user?.name}</h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100">
                                Physician
                            </span>
                        </div>
                        <p className="mt-2 text-sm sm:text-lg text-gray-500 max-w-md">
                            Clinical Command Center: Practice overview and risk management.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Patients"
                    value={patients?.length || 0}
                    icon={Users}
                    iconColor="bg-blue-100 text-blue-600"
                />
                <Card
                    title="Clinical Alerts"
                    value={criticalPatientsCount}
                    icon={AlertCircle}
                    iconColor="bg-red-100 text-red-600"
                />
                <Card
                    title="Pending Reviews (14 Days)"
                    value={pendingReviewsCount}
                    icon={ClipboardList}
                    iconColor="bg-purple-100 text-purple-600"
                />
                <Card
                    title="Follow-up Due (7 Days)"
                    value={followUpDueCount}
                    icon={Activity}
                    iconColor="bg-amber-100 text-amber-600"
                />
            </div>

            {/* Recent Records */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Activity className="h-6 w-6 text-primary-500 mr-3" />
                        Recent Medical Records
                    </h3>
                </div>
                <div className="space-y-4">
                    {myRecords.slice(0, 5).map(record => (
                        <div key={record._id || record.id} className="group flex items-start p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                            <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                                <FileText className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">
                                    {(record.patientId as any)?.name || record.patientName || 'Unknown Patient'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    {record.diagnosis} <span className="mx-2 font-black text-gray-200">·</span> {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100 ml-4 flex-shrink-0">
                                Completed
                            </span>
                        </div>
                    ))}
                    {myRecords.length === 0 && (
                        <div className="py-10 text-center">
                            <Activity className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400">No records yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
