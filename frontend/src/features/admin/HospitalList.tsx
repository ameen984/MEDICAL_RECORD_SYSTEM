import { useState } from 'react';
import { useGetHospitalsQuery, useDeleteHospitalMutation } from './hospitalsApi';
import Table from '../../components/ui/Table';
import type { Column } from '../../components/ui/Table';
import HospitalModal from './HospitalModal';
import type { Hospital } from '../../types';
import { Plus, Building2, Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function HospitalList() {
    const { data: hospitals, isLoading, isError, error } = useGetHospitalsQuery();
    const [deleteHospital] = useDeleteHospitalMutation();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

    const handleCreate = () => {
        setSelectedHospital(null);
        setIsModalOpen(true);
    };

    const handleEdit = (hospital: Hospital) => {
        setSelectedHospital(hospital);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you certain you want to remove ${name} from the network? Doing so will cascade orphans.`)) {
            try {
                await deleteHospital(id).unwrap();
            } catch (err) {
                console.error('Failed to delete hospital:', err);
                alert('Failed to delete hospital.');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-6 h-6" />
                <p className="font-medium">Error loading hospitals: {'data' in error! ? (error as any).data.message : 'Network error'}</p>
            </div>
        );
    }

    const columns: Column<Hospital>[] = [
        {
            key: 'name',
            header: 'Facility Name',
            render: (hospital: Hospital) => (
                <div className="font-semibold text-gray-900 bg-gray-50/50 p-2 rounded-lg inline-flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-500" />
                    {hospital.name}
                </div>
            )
        },
        { key: 'phone', header: 'Phone' },
        { key: 'contactEmail', header: 'Support Email' },
        { 
            key: 'status', 
            header: 'Status',
            render: (hospital: Hospital) => (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    hospital.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {hospital.status.toUpperCase()}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (hospital: Hospital) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleEdit(hospital)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm"
                        title="Edit Hospital"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete((hospital.id || hospital._id)!, hospital.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm"
                        title="Delete Hospital"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center pb-5 border-b border-gray-200">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-primary-500" />
                        Network Hospitals
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Manage registered clinical facilities and organizations.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Register Facility
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    data={hospitals || []}
                    keyExtractor={(hospital) => (hospital.id || hospital._id)!}
                />
            </div>

            <HospitalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                hospitalToEdit={selectedHospital}
            />
        </div>
    );
}
