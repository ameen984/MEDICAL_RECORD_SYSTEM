import { useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation } from '../users/usersApi';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import Table from '../../components/ui/Table';
import UserModal from './UserModal';
import CreateUserModal from './CreateUserModal';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import type { User } from '../../types';

export default function UserList() {
    const { data: users, isLoading } = useGetUsersQuery();
    const [deleteUser] = useDeleteUserMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'doctor' | 'patient'>('all');

    const handleDelete = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(userId).unwrap();
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    };

    const handleEdit = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const filteredUsers = users?.filter(user => {
        const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        const matchesSearch = nameMatch || emailMatch;
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const columns = [
        { 
            key: 'name', 
            header: 'Identity',
            render: (user: User) => (
                <div className="flex items-center">
                    <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center mr-3 text-primary-600 font-bold text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{user.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Access Level',
            render: (user: User) => {
                const colors = {
                    admin: 'bg-red-50 text-red-700 border-red-200',
                    doctor: 'bg-blue-50 text-blue-700 border-blue-200',
                    patient: 'bg-green-50 text-green-700 border-green-200'
                };
                return (
                    <span className={`
                        inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border
                        ${colors[user.role as keyof typeof colors] || 'bg-gray-50 text-gray-700'}
                    `}>
                        {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                        {user.role}
                    </span>
                );
            }
        },
        {
            key: 'facility',
            header: 'Assigned Facility',
            render: (user: User) => {
                if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'patient') {
                    if (user.role === 'super_admin' || user.role === 'patient') {
                        return <span className="text-gray-400 text-xs italic">N/A</span>;
                    }
                }

                if (!user.hospitalIds || user.hospitalIds.length === 0) {
                    return <span className="text-sm font-medium text-gray-500">Unassigned</span>;
                }

                if (user.hospitalIds.length === 1) {
                     const h = user.hospitalIds[0];
                     const name = typeof h === 'object' ? h.name : String(h);
                     return <span className="text-sm font-medium text-gray-700">{name}</span>;
                }

                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-900 bg-blue-50 px-2 rounded-md w-fit">
                            Multiple ({user.hospitalIds.length})
                        </span>
                        <div className="text-[11px] text-gray-500 max-w-[200px] truncate">
                            {user.hospitalIds.map(h => typeof h === 'object' ? h.name : String(h)).join(', ')}
                        </div>
                    </div>
                );
            }
        },
        { key: 'phone', header: 'Phone' },
        {
            key: 'actions',
            header: 'Actions',
            render: (user: User) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(user);
                        }}
                        className="text-primary-600 hover:text-primary-900 transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete((user.id || user._id) as string);
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        disabled={user.role === 'admin' || user.role === 'super_admin'}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Premium Header/Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            User <span className="text-primary-600">Management</span>
                        </h2>
                        <p className="mt-2 text-lg text-gray-500 max-w-md">
                            Monitor, edit, and organize system access for all platform members.
                        </p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="relative z-10 flex items-center px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        <UserPlus className="h-5 w-5 mr-2" />
                        Create New User
                    </button>
                </div>
            </div>

            {/* Filter/Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <UserPlus className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        className="px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm font-bold text-gray-700 flex-shrink-0"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin Only</option>
                        <option value="doctor">Doctors Only</option>
                        <option value="patient">Patients Only</option>
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <Table data={filteredUsers || []} columns={columns} isLoading={isLoading} />
            </div>

            <ErrorBoundary>
                <UserModal
                    isOpen={isModalOpen && userToEdit !== null}
                    onClose={() => setIsModalOpen(false)}
                    userToEdit={userToEdit}
                />
                <CreateUserModal
                    isOpen={isModalOpen && userToEdit === null}
                    onClose={() => setIsModalOpen(false)}
                />
            </ErrorBoundary>
        </div>
    );
}
