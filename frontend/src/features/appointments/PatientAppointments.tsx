import { useState } from 'react';
import { useGetMyAppointmentsQuery, useCreateAppointmentMutation } from './appointmentsApi';
import { useGetUsersQuery } from '../users/usersApi';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Plus } from 'lucide-react';
import type { Appointment } from '../../types';

export default function PatientAppointments() {
    const { data: appointments, isLoading } = useGetMyAppointmentsQuery();
    const { data: users } = useGetUsersQuery(); // To select a doctor
    const [createAppointment, { isLoading: isCreating }] = useCreateAppointmentMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        doctorId: '',
        date: '',
        time: '',
        reason: '',
    });

    const doctors = users?.filter(u => u.role === 'doctor') || [];

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAppointment(formData).unwrap();
            setIsModalOpen(false);
            setFormData({ doctorId: '', date: '', time: '', reason: '' });
        } catch (error) {
            console.error('Failed to book appointment:', error);
            alert('Failed to book appointment');
        }
    };

    const columns = [
        { key: 'doctorName', header: 'Doctor' },
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
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
                    <p className="mt-1 text-gray-500">View and manage your appointments</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Book Appointment
                </button>
            </div>

            <Table data={appointments || []} columns={columns} isLoading={isLoading} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Book Appointment"
            >
                <form onSubmit={handleBook} className="space-y-4">
                    <Select
                        label="Select Doctor"
                        required
                        value={formData.doctorId}
                        onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                        options={doctors.map(d => ({ value: d.id, label: `Dr. ${d.name}` }))}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Date"
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                        <Input
                            label="Time"
                            type="time"
                            required
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        />
                    </div>

                    <Input
                        label="Reason"
                        type="text"
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Checkup, consultation, etc."
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                        >
                            {isCreating ? 'Booking...' : 'Book Appointment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
