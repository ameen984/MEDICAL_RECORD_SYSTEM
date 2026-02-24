import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetPatientByIdQuery, useGetPatientMedicalHistoryQuery, useUpdatePatientMedicalInfoMutation } from '../patients/patientsApi';
import { useGetReportsQuery } from '../reports/reportsApi';
import { ArrowLeft, User, Phone, Mail, Heart, AlertCircle, FileText, Pencil, Save, Loader2, Activity } from 'lucide-react';
import Loader from '../../components/Loader';

export default function MedicalHistory() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    
    const { data: patient, isLoading: patientLoading } = useGetPatientByIdQuery(patientId!);
    const { data: records, isLoading: recordsLoading } = useGetPatientMedicalHistoryQuery(patientId!);
    const { data: reports } = useGetReportsQuery({ patientId });
    const [updateMedicalInfo, { isLoading: isSaving }] = useUpdatePatientMedicalInfoMutation();

    const [isEditingMedical, setIsEditingMedical] = useState(false);
    const [savedMedical, setSavedMedical] = useState(false);
    const [medicalForm, setMedicalForm] = useState({ allergies: '', chronicConditions: '' });

    const handleEditMedical = () => {
        setMedicalForm({
            allergies: patient?.allergies || '',
            chronicConditions: (patient as any)?.chronicConditions || '',
        });
        setIsEditingMedical(true);
    };

    const handleSaveMedical = async () => {
        try {
            await updateMedicalInfo({
                id: patientId!,
                data: medicalForm,
            }).unwrap();
            setIsEditingMedical(false);
            setSavedMedical(true);
            setTimeout(() => setSavedMedical(false), 2000);
        } catch (err) {
            console.error('Failed to update medical info:', err);
        }
    };

    if (patientLoading || recordsLoading) {
        return <Loader />;
    }

    if (!patient) {
        return <div>Patient not found</div>;
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Back Button */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/patients')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-black text-gray-500 hover:text-primary-600 transition-colors bg-white rounded-xl shadow-sm border border-gray-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Patients
                </button>
            </div>

            {/* Premium Header/Banner */}
            <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-20 -mt-20 opacity-40 blur-3xl"></div>
                <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                         <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 font-black text-2xl shadow-inner">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{patient.name}</h2>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                    Patient
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {patient.email}</span>
                                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {patient.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-l border-gray-100 pl-6 h-12">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blood Type</p>
                            <p className="text-lg font-black text-red-600">{patient.bloodType || 'N/A'}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Records</p>
                            <p className="text-lg font-black text-gray-900">{records?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctor-Editable Medical Info Card */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8 mb-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                            Clinical Notes (Doctor Only)
                            {savedMedical && (
                                <span className="ml-3 inline-flex items-center text-sm font-black text-green-600 animate-pulse">
                                    Saved!
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Manage core clinical observations and allergies.</p>
                    </div>
                    {!isEditingMedical ? (
                        <button
                            onClick={handleEditMedical}
                            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Notes
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                             <button
                                onClick={() => setIsEditingMedical(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveMedical}
                                disabled={isSaving}
                                className="inline-flex items-center px-6 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative p-6 bg-red-50 rounded-2xl border border-red-100">
                        <label className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 block">Critical Allergies</label>
                        {isEditingMedical ? (
                            <textarea
                                value={medicalForm.allergies}
                                onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-sm font-medium"
                                placeholder="List all allergies..."
                            />
                        ) : (
                            <div className="min-h-[60px]">
                                <p className={`text-base font-bold ${patient.allergies && patient.allergies !== 'None' ? 'text-red-700' : 'text-gray-400 italic'}`}>
                                    {patient.allergies || 'No allergies recorded'}
                                </p>
                            </div>
                        )}
                        <Heart className="absolute bottom-4 right-4 h-12 w-12 text-red-500 opacity-5" />
                    </div>
                    <div className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Chronic Conditions</label>
                        {isEditingMedical ? (
                            <textarea
                                value={medicalForm.chronicConditions}
                                onChange={(e) => setMedicalForm({ ...medicalForm, chronicConditions: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm font-medium"
                                placeholder="Diabetes, Hypertension, etc..."
                            />
                        ) : (
                            <div className="min-h-[60px]">
                                <p className="text-base font-bold text-gray-700">
                                    {(patient as any)?.chronicConditions || 'None recorded'}
                                </p>
                            </div>
                        )}
                        <Activity className="absolute bottom-4 right-4 h-12 w-12 text-gray-900 opacity-5" />
                    </div>
                </div>
            </div>

            {/* Medical Records Timeline */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Clinical History</h3>
                        <p className="text-sm text-gray-500 mt-1">Timeline of patient visits and diagnoses.</p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-black text-gray-500 uppercase tracking-tight">
                        {records?.length || 0} Events
                    </span>
                </div>

                {records && records.length > 0 ? (
                    <div className="relative space-y-0 before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-gray-100">
                        {records.map((record) => (
                            <div key={record.id} className="relative pl-16 pb-12 group last:pb-0">
                                <div className="absolute left-4 top-1 h-4 w-4 rounded-full bg-white border-4 border-primary-500 z-10 group-hover:scale-125 transition-transform"></div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:border-primary-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-50">
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Diagnosis</p>
                                            <h4 className="text-lg font-black text-gray-900 leading-tight">{record.diagnosis}</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900">{record.date}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consult Date</p>
                                            </div>
                                            <div className="h-10 w-px bg-gray-100 mx-1"></div>
                                            <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-primary-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Treatment Plan</p>
                                             <p className="text-sm font-bold text-gray-700 leading-relaxed">{record.treatment}</p>
                                        </div>
                                        {record.prescriptions && (
                                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-50">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Prescribed Medication</p>
                                                <p className="text-sm font-bold text-blue-700 leading-relaxed">{record.prescriptions}</p>
                                            </div>
                                        )}
                                    </div>
                                    {record.notes && (
                                        <div className="mt-6 pt-4 border-t border-gray-50">
                                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observations</p>
                                             <p className="text-sm text-gray-500 italic leading-relaxed">{record.notes}</p>
                                        </div>
                                    )}
                                    <div className="mt-6 flex items-center justify-between">
                                         <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <User className="h-3 w-3 mr-1.5" />
                                            Consulting MD: Dr. {record.doctorName}
                                         </div>
                                         <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100">
                                            Official Record
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-bold text-gray-400 tracking-tight">Clinical history is empty</p>
                    </div>
                )}
            </div>

            {/* Reports */}
            {reports && reports.length > 0 && (
                <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8 mt-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Laboratory Reports</h3>
                            <p className="text-sm text-gray-500 mt-1">Uploaded attachments and scan results.</p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-black text-gray-500 uppercase tracking-tight">
                            {reports.length} Items
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reports.map(report => (
                            <div key={report.id} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-start justify-between mb-4">
                                     <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6 text-primary-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{report.uploadDate}</span>
                                </div>
                                <h4 className="text-sm font-black text-gray-900 mb-1 truncate uppercase tracking-tight group-hover:text-primary-600 transition-colors">{report.title}</h4>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-black text-gray-600 uppercase tracking-widest">{report.type}</span>
                                    <span className="text-[10px] font-bold text-gray-300 truncate max-w-[120px]">{report.fileName}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <p className="text-[10px] font-bold text-gray-400">By: {(report as any).uploadedBy?.name || 'Unknown'}</p>
                                    <Link to="#" className="text-[10px] font-black text-primary-600 uppercase tracking-widest underline-offset-4 hover:underline">Download</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

