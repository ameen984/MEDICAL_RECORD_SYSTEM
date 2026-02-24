import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { useGetRecordsQuery } from '../records/recordsApi';
import { Users, FileText, Activity, Calendar } from 'lucide-react';
import Card from '../../components/ui/Card';
import Loader from '../../components/Loader';

export default function DoctorDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: patients, isLoading: patientsLoading } = useGetPatientsQuery();
    const { data: records, isLoading: recordsLoading } = useGetRecordsQuery({});

    if (patientsLoading || recordsLoading) {
        return <Loader />;
    }

    const myRecords = records?.filter(r => r.doctorId === user?.id) || [];
    const todayRecords = myRecords.filter(
        r => r.date === new Date().toISOString().split('T')[0]
    );

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.name}
                </h2>
                <p className="mt-1 text-gray-500">
                    Your doctor dashboard
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Patients"
                    value={patients?.length || 0}
                    icon={Users}
                    iconColor="bg-blue-500"
                />
                <Card
                    title="Today's Appointments"
                    value={todayRecords.length}
                    icon={Calendar}
                    iconColor="bg-green-500"
                />
                <Card
                    title="Total Records"
                    value={myRecords.length}
                    icon={FileText}
                    iconColor="bg-purple-500"
                />
                <Card
                    title="Active Cases"
                    value={patients?.length || 0}
                    icon={Activity}
                    iconColor="bg-orange-500"
                />
            </div>

            {/* Recent Records */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Medical Records</h3>
                <div className="space-y-3">
                    {myRecords.slice(0, 5).map(record => (
                        <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{record.patientName}</p>
                                <p className="text-xs text-gray-500">{record.diagnosis}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">{record.date}</p>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Completed
                                </span>
                            </div>
                        </div>
                    ))}
                    {myRecords.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No records yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
