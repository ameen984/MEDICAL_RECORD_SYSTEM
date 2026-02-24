import { useGetAppointmentsQuery, useUpdateAppointmentStatusMutation } from './appointmentsApi';
import Table from '../../components/ui/Table';
import { Check, X } from 'lucide-react';
import type { Appointment } from '../../types';

export default function DoctorAppointments() {
    const { data: appointments, isLoading } = useGetAppointmentsQuery();
    const [updateStatus] = useUpdateAppointmentStatusMutation();

    const handleStatusUpdate = async (id: string, status: Appointment['status']) => {
        try {
            await updateStatus({ id, status }).unwrap();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const columns = [
        { key: 'patientName', header: 'Patient' },
        { key: 'date', header: 'Date' },
        { key: 'time', header: 'Time' },
        { key: 'reason', header: 'Reason' },
        {
            key: 'status',
            header: 'Status',
            render: (apt: Appointment) => (
                <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    ${apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${apt.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    ${apt.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                    {apt.status}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (apt: Appointment) => apt.status === 'pending' && (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Confirm"
                    >
                        <Check className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Cancel"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Appointment Schedule</h2>
                    <p className="mt-1 text-gray-500">Manage patient appointments</p>
                </div>
            </div>

            <Table data={appointments || []} columns={columns} isLoading={isLoading} />
        </div>
    );
}
