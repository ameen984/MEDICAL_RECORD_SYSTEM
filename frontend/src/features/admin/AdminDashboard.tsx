import { useSelector } from 'react-redux';
import { Shield, Users, UserCheck, Activity, FileText, Building2 } from 'lucide-react';
import type { RootState } from '../../app/store';
import { 
    useGetSystemStatsQuery, 
    useGetAdmissionVolumeQuery, 
    useGetFacilityActivityQuery, 
    useGetDiseaseDemographicsQuery 
} from './analyticsApi';
import { useGetActivityLogsQuery } from './activityApi';
import Card from '../../components/ui/Card';
import Loader from '../../components/Loader';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#ef4444'];

export default function AdminDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);
    
    // Fetch analytics data
    const { data: stats, isLoading: statsLoading } = useGetSystemStatsQuery(undefined);
    const { data: volumeData, isLoading: volumeLoading } = useGetAdmissionVolumeQuery(undefined);
    const { data: facilityData, isLoading: facilityLoading } = useGetFacilityActivityQuery(undefined);
    const { data: demoData, isLoading: demoLoading } = useGetDiseaseDemographicsQuery(undefined);
    
    const { data: activityResponse, isLoading: activityLoading } = useGetActivityLogsQuery(undefined, {
        pollingInterval: 5000,
    });

    if (statsLoading || volumeLoading || facilityLoading || demoLoading || activityLoading) {
        return <Loader />;
    }

    const activityLogs = activityResponse?.data || [];

    return (
        <div className="space-y-8 pb-10">
            {/* Premium Header/Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>
                
                <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="z-10">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            System <span className="text-primary-600">Analytics</span>
                        </h2>
                        <p className="mt-2 text-sm sm:text-lg text-gray-500 max-w-md">
                            Welcome, {user?.name}. Here's the current state of your network.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto z-10">
                        <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-xl">
                            <Shield className="h-6 w-6 text-primary-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Patients"
                    value={stats?.totalPatients || 0}
                    icon={Users}
                    iconColor="bg-blue-100 text-blue-600"
                />
                <Card
                    title="Total Doctors"
                    value={stats?.totalDoctors || 0}
                    icon={UserCheck}
                    iconColor="bg-green-100 text-green-600"
                />
                <Card
                    title="Medical Records"
                    value={stats?.totalRecords || 0}
                    icon={FileText}
                    iconColor="bg-purple-100 text-purple-600"
                />
                {user?.role === 'super_admin' && (
                    <Card
                        title="Active Hospitals"
                        value={stats?.totalHospitals || 0}
                        icon={Building2}
                        iconColor="bg-amber-100 text-amber-600"
                    />
                )}
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Admissions Volume Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Patient Admissions Volume (6 Mo)</h3>
                    <div className="h-72">
                        {volumeData && volumeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="admissions" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAdmissions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">No volume data available</div>
                        )}
                    </div>
                </div>

                {/* Facility Activity Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Activity by Facility</h3>
                    <div className="h-72">
                        {facilityData && facilityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={facilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="activity" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">No activity data available</div>
                        )}
                    </div>
                </div>
                
                {/* Disease Demographics */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Prevalent Conditions Demographics</h3>
                    <div className="h-72">
                        {demoData && demoData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={demoData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {demoData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">No conditions reported yet</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Mini-Feed */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Live Stream</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-72">
                        {activityLogs.slice(0, 5).map(log => (
                            <div key={log._id} className="flex gap-4">
                                <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                    log.action === 'LOGIN' ? 'bg-blue-100 text-blue-600' : 
                                    log.action === 'SECURITY_ALERT' ? 'bg-red-100 text-red-600' :
                                    log.action === 'PROFILE_UPDATE' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    <Activity className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                                    <p className="text-xs text-gray-500">{log.details}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
