import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { Users, Search, ClipboardList } from 'lucide-react';
import Table from '../../components/ui/Table';
import type { Patient } from '../../types';

export default function PatientList() {
    const { data: patients, isLoading, isError } = useGetPatientsQuery();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredPatients = patients?.filter((patient) => {
        const term = searchTerm.toLowerCase();
        const nameMatch = patient.name?.toLowerCase().includes(term) ?? false;
        const emailMatch = patient.email?.toLowerCase().includes(term) ?? false;
        return nameMatch || emailMatch;
    });

    const columns = [
        {
            key: 'name',
            header: 'Patient',
            render: (patient: Patient) => (
                <div className="flex items-center">
                    <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center mr-3 text-primary-600 font-bold text-xs flex-shrink-0">
                        {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{patient.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            {patient.email || '—'}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (patient: Patient) => (
                <span className="text-sm text-gray-600">{patient.phone || '—'}</span>
            ),
        },
        {
            key: 'bloodType',
            header: 'Blood Type',
            render: (patient: Patient) => (
                <span className="text-sm font-medium text-gray-700">{patient.bloodType || '—'}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (patient: Patient) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${(patient.id || patient._id) as string}`);
                    }}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors"
                >
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                    View History
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Patient <span className="text-primary-600">Directory</span>
                        </h2>
                        <p className="mt-2 text-lg text-gray-500 max-w-md">
                            Browse all registered patients and access their full medical history.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
                        <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary-500" />
                        </div>
                        <div className="pr-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Total Patients</p>
                            <p className="text-xl font-black text-gray-900 leading-tight">{patients?.length ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Search by patient name or email..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Error State */}
            {isError && (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-red-50 text-red-700 border border-red-100">
                    <span className="font-bold text-sm">Failed to load patients. Please try again.</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table<Patient>
                    data={filteredPatients || []}
                    columns={columns}
                    isLoading={isLoading}
                    onRowClick={(patient) =>
                        navigate(`/patients/${(patient.id || patient._id) as string}`)
                    }
                    keyExtractor={(patient) => String(patient.id || patient._id)}
                />
            </div>
        </div>
    );
}
