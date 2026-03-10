import { useGetActivityLogsQuery } from './activityApi';
import Table from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import { Activity, Clock } from 'lucide-react';
import type { ActivityLog } from './activityApi';
import clsx from 'clsx';

export default function AuditLogs() {
    const { data: logsData, isLoading, isError } = useGetActivityLogsQuery(undefined, { pollingInterval: 30000 });
    
    // The query returns { success, count, data: ActivityLog[] } based on your backend response pattern
    const logs = logsData?.data || [];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 bg-red-50 text-red-600 rounded-xl font-medium">
                Failed to load system audit logs. Verify connection.
            </div>
        );
    }

    const getActionBadgeColors = (action: string) => {
        switch(action) {
            case 'LOGIN': return 'bg-blue-100 text-blue-700';
            case 'SIGNUP': return 'bg-indigo-100 text-indigo-700';
            case 'ROLE_CHANGE': return 'bg-orange-100 text-orange-700';
            case 'PROFILE_UPDATE': return 'bg-teal-100 text-teal-700';
            case 'ACCOUNT_SUSPENDED': 
            case 'USER_DELETE':
                return 'bg-red-100 text-red-700';
            case 'ACCOUNT_ACTIVATED': return 'bg-green-100 text-green-700';
            case 'CREATED_HOSPITAL': return 'bg-purple-100 text-purple-700';
            case 'DELETED_HOSPITAL': return 'bg-pink-100 text-pink-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const columns: Column<ActivityLog>[] = [
        {
            key: 'action',
            header: 'Event Action',
            render: (row: ActivityLog) => (
                <span className={clsx("px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap", getActionBadgeColors(row.action))}>
                    {row.action.replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'details',
            header: 'Event Description',
            render: (row: ActivityLog) => (
                <div className="font-medium text-gray-800">{row.details}</div>
            )
        },
        {
            key: 'userName',
            header: 'Actor',
            render: (row: ActivityLog) => (
                <div className="text-gray-600 font-semibold">{row.userName}</div>
            )
        },
        {
            key: 'timestamp',
            header: 'Timestamp',
            render: (row: ActivityLog) => {
                const date = new Date(row.timestamp);
                return (
                    <div className="flex items-center text-sm text-gray-500 font-mono">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center pb-5 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-primary-500" />
                        Network Audit Logs
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Chronological history of security events across the entire system. Auto-refreshes.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    data={logs}
                    keyExtractor={(log) => log._id}
                />
            </div>
        </div>
    );
}
