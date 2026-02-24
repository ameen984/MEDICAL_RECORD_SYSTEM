import { useNavigate } from 'react-router-dom';
import { useGetPatientsQuery } from '../patients/patientsApi';
import { Search } from 'lucide-react';
import Table from '../../components/ui/Table';
import type { Patient } from '../../types';

export default function PatientList() {
    const navigate = useNavigate();
    const { data: patients, isLoading } = useGetPatientsQuery();

    const columns = [
        { key: 'name', header: 'Patient Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'bloodType', header: 'Blood Type' },
        {
            key: 'allergies',
            header: 'Allergies',
            render: (patient: Patient) => (
                <span className={patient.allergies && patient.allergies !== 'None' ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {patient.allergies || 'None'}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Premium Header/Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-40 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Clinical Registry</h2>
                        <p className="mt-2 text-lg text-gray-500 font-medium">Monitoring and managing active patient cases.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl">
                         <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                             <Search className="h-6 w-6 text-primary-500" />
                         </div>
                         <div className="pr-4">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">Total Managed</p>
                             <p className="text-xl font-black text-gray-900 leading-tight">{patients?.length || 0}</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* Search Bar - Polished */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-300" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search by name, legal ID, or status..."
                        className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-400 text-sm font-bold text-gray-700 placeholder-gray-400"
                    />
                </div>
                <div className="flex items-center gap-3">
                     <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-tight hover:bg-gray-50 transition-colors shadow-sm">
                        All Status
                     </button>
                     <button className="px-6 py-4 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-tight hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200">
                        Filter
                     </button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-3xl border border-gray-100 overflow-hidden">
                <Table
                    data={patients || []}
                    columns={columns}
                    isLoading={isLoading}
                    onRowClick={(patient) => navigate(`/patients/${patient.id}`)}
                />
            </div>
        </div>
    );
}
