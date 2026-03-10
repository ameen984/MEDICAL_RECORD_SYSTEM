import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetRecordsQuery } from '../records/recordsApi';
import { useGetReportsQuery } from '../reports/reportsApi';
import { useGetPatientProfileQuery } from './patientApi';
import { FileText, Calendar, FolderOpen, Heart, Ruler, Weight, TrendingUp, CalendarClock, Activity, ShieldAlert, Cigarette, Wine, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Loader from '../../components/Loader';

// BMI calculation helper
const calculateBMI = (heightCm: string, weightKg: string) => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    return w / ((h / 100) ** 2);
};

const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (bmi < 25) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-100' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-100' };
};

export default function PatientDashboard() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { data: records, isLoading: recordsLoading } = useGetRecordsQuery({ patientId: user?.id });
    const { data: reports, isLoading: reportsLoading } = useGetReportsQuery({ patientId: user?.id });
    const { data: profileData } = useGetPatientProfileQuery(user?.id ?? '', { skip: !user?.id });

    if (recordsLoading || reportsLoading) {
        return <Loader />;
    }

    const patientData = profileData?.data;
    const bmi = patientData ? calculateBMI(patientData.height, patientData.weight) : null;
    const bmiCategory = bmi ? getBMICategory(bmi) : null;

    const lastVisit = records && records.length > 0
        ? new Date(records[records.length - 1].date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
        : 'No visits yet';

    // Find the nearest upcoming follow-up
    const nextFollowUpDate = records
        ?.filter(r => r.nextFollowUp && new Date(r.nextFollowUp) >= new Date())
        .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime())[0]?.nextFollowUp;

    const formattedFollowUp = nextFollowUpDate
        ? new Date(nextFollowUpDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
        : 'Not scheduled';

    return (
        <div className="space-y-8 pb-10">
            {/* Premium Header/Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-10 -mb-10 opacity-30 blur-2xl"></div>
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Welcome back, <span className="text-primary-600">{user?.name}</span>
                        </h2>
                        <p className="mt-2 text-lg text-gray-500 max-w-md">
                            It's great to see you. Here's a snapshot of your health journey today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                             <p className="text-sm font-semibold text-gray-900 leading-none">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</p>
                             <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-xl">
                            <Calendar className="h-6 w-6 text-primary-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                    title="Total Records"
                    value={records?.length || 0}
                    icon={FileText}
                    iconColor="bg-blue-100 text-blue-600"
                />
                <Card
                    title="Medical Reports"
                    value={reports?.length || 0}
                    icon={FolderOpen}
                    iconColor="bg-green-100 text-green-600"
                />
                <Card
                    title="Last Visit"
                    value={lastVisit}
                    icon={Calendar}
                    iconColor="bg-purple-100 text-purple-600"
                />
                <Card
                    title="Next Follow-up"
                    value={formattedFollowUp}
                    icon={CalendarClock}
                    iconColor="bg-orange-100 text-orange-600"
                />
            </div>

{/* Health Vitals Card */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <TrendingUp className="h-6 w-6 text-primary-500 mr-3" />
                            Health Vitals
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Your core body measurements and markers.</p>
                    </div>
                    <Link to="/profile" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all">
                        Manage Vitals →
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Blood Type */}
                    <div className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all">
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-red-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <Heart className="h-8 w-8 text-red-500 mb-3" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Blood Type</p>
                        <p className="text-3xl font-black text-gray-900 mt-2 tracking-tighter">
                            {patientData?.bloodType || (
                                <Link to="/profile" className="text-sm font-bold text-red-500 hover:underline">Add +</Link>
                            )}
                        </p>
                    </div>

                    {/* Height */}
                    <div className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <Ruler className="h-8 w-8 text-blue-500 mb-3" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Height</p>
                        <div className="flex items-baseline mt-2">
                             <p className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                                {patientData?.height || <Link to="/profile" className="text-sm font-bold text-blue-500 hover:underline">Add</Link>}
                             </p>
                             {patientData?.height && <span className="text-sm font-bold text-gray-400 ml-1">cm</span>}
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="group relative flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 transition-all">
                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-purple-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <Weight className="h-8 w-8 text-purple-500 mb-3" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight</p>
                        <div className="flex items-baseline mt-2">
                             <p className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                                {patientData?.weight || <Link to="/profile" className="text-sm font-bold text-purple-500 hover:underline">Add</Link>}
                             </p>
                             {patientData?.weight && <span className="text-sm font-bold text-gray-400 ml-1">kg</span>}
                        </div>
                    </div>

                    {/* BMI */}
                    {bmi && bmiCategory ? (
                        <div className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${bmiCategory.bg.replace('bg-', 'hover:border-')}`}>
                            <div className={`absolute top-4 right-4 h-2 w-2 rounded-full ${bmiCategory.color.replace('text-', 'bg-')} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
                            <Activity className={`h-8 w-8 ${bmiCategory.color} mb-3`} />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BMI Index</p>
                            <p className={`text-3xl font-black ${bmiCategory.color} mt-2 tracking-tighter tabular-nums`}>{bmi.toFixed(1)}</p>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${bmiCategory.color} mt-2 px-2 py-0.5 rounded-full ${bmiCategory.bg} border ${bmiCategory.color.replace('text-', 'border-')} border-opacity-20`}>
                                {bmiCategory.label}
                            </span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                             <TrendingUp className="h-8 w-8 text-gray-300 mb-3" />
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BMI Index</p>
                             <p className="text-xs text-gray-400 text-center mt-2 px-6">Available after providing height/weight</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Medical Overview */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <ShieldAlert className="h-6 w-6 text-red-500 mr-3" />
                            Medical Overview
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Key clinical information from your profile.</p>
                    </div>
                    <Link to="/profile" className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all">
                        Edit Profile →
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Allergies */}
                    <div className="group p-5 bg-red-50/50 rounded-2xl border border-red-100/50 hover:border-red-200 transition-all">
                        <div className="flex items-center mb-3">
                            <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center mr-3">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">Allergies</h4>
                        </div>
                        {patientData?.allergies ? (
                            <div className="flex flex-wrap gap-2">
                                {patientData.allergies.split(',').map((allergy: string, i: number) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                        {allergy.trim()}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No allergies recorded</p>
                        )}
                    </div>

                    {/* Chronic Conditions */}
                    <div className="group p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 hover:border-amber-200 transition-all">
                        <div className="flex items-center mb-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center mr-3">
                                <Heart className="h-5 w-5 text-amber-600" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">Chronic Conditions</h4>
                        </div>
                        {patientData?.chronicConditions ? (
                            <div className="flex flex-wrap gap-2">
                                {patientData.chronicConditions.split(',').map((condition: string, i: number) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                        {condition.trim()}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No chronic conditions recorded</p>
                        )}
                    </div>

                    {/* Smoking */}
                    <div className="group p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3">
                                    <Cigarette className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Smoking</h4>
                                    <p className="text-xs text-gray-500">Tobacco usage</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                patientData?.habits?.smoking === 'No' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : patientData?.habits?.smoking === 'Yes'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                {patientData?.habits?.smoking || 'Not set'}
                            </span>
                        </div>
                    </div>

                    {/* Alcohol */}
                    <div className="group p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3">
                                    <Wine className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Alcohol</h4>
                                    <p className="text-xs text-gray-500">Drinking habits</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                patientData?.habits?.alcohol === 'No' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : patientData?.habits?.alcohol === 'Yes'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                {patientData?.habits?.alcohol || 'Not set'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Medical Records */}
                <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <Activity className="h-6 w-6 text-primary-500 mr-3" />
                            Recent Records
                        </h3>
                        <Link to="/records" className="text-sm font-bold text-primary-600 hover:text-primary-700">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {records && records.slice(-4).reverse().map(record => (
                            <div key={record.id} className="group flex items-start p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                                <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                                    <FileText className="h-5 w-5 text-primary-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{record.diagnosis}</p>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                                        Dr. {record.doctorId?.name || record.doctorName || 'Unknown'} <span className="mx-2 font-black text-gray-200">·</span> {record.date}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100 ml-4 flex-shrink-0">
                                    Finalized
                                </span>
                            </div>
                        ))}
                        {(!records || records.length === 0) && (
                            <div className="py-10 text-center">
                                <Activity className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-400">No medical history found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Reports */}
                <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <FolderOpen className="h-6 w-6 text-primary-500 mr-3" />
                            Recent Reports
                        </h3>
                        <Link to="/reports" className="text-sm font-bold text-primary-600 hover:text-primary-700">View All</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {reports && reports.slice(-4).reverse().map(report => (
                            <div key={report.id} className="group flex items-start p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-primary-100 transition-all cursor-pointer">
                                <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center mr-3 group-hover:bg-primary-100 transition-colors flex-shrink-0">
                                    <FileText className="h-5 w-5 text-primary-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{report.title}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5 capitalize leading-none flex items-center">
                                        {report.type} <span className="mx-1.5 text-gray-300">•</span> {report.uploadDate}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {(!reports || reports.length === 0) && (
                        <div className="py-10 text-center">
                             <FolderOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                             <p className="text-sm font-bold text-gray-400">No reports uploaded yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

