import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetUsersQuery } from '../users/usersApi';
import { useGetRecordsQuery } from '../records/recordsApi';
import { Users, UserCheck, Activity, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Loader from '../../components/Loader';

export default function AdminDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: users, isLoading: usersLoading } = useGetUsersQuery();
    const { data: records, isLoading: recordsLoading } = useGetRecordsQuery({});

    if (usersLoading || recordsLoading) {
        return <Loader />;
    }

    const stats = {
        totalUsers: users?.length || 0,
        doctors: users?.filter(u => u.role === 'doctor').length || 0,
        patients: users?.filter(u => u.role === 'patient').length || 0,
        totalRecords: records?.length || 0,
    };

    return (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Welcome, {user?.name}
                </h2>
                <p className="mt-1 text-gray-500">
                    System administration dashboard
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    iconColor="bg-blue-500"
                />
                <Card
                    title="Doctors"
                    value={stats.doctors}
                    icon={UserCheck}
                    iconColor="bg-green-500"
                />
                <Card
                    title="Patients"
                    value={stats.patients}
                    icon={Activity}
                    iconColor="bg-purple-500"
                />
                <Card
                    title="Total Records"
                    value={stats.totalRecords}
                    icon={FileText}
                    iconColor="bg-orange-500"
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {records?.slice(0, 5).map(record => (
                        <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{record.patientName}</p>
                                <p className="text-xs text-gray-500">Diagnosis: {record.diagnosis}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500">{record.doctorName}</p>
                                <p className="text-xs text-gray-400">{record.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
