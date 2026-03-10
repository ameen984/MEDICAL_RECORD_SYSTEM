import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPatientByIdQuery, useGetPatientMedicalHistoryQuery, useUpdatePatientMedicalInfoMutation } from '../patients/patientsApi';
import { useGetReportsQuery, useDeleteReportMutation } from '../reports/reportsApi';
import { useDeleteRecordMutation, useUpdateRecordMutation } from '../records/recordsApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { ArrowLeft, User, Phone, Mail, AlertCircle, FileText, Pencil, Save, Loader2, Activity, Trash2, X, Scale, Ruler, Cigarette, Wine, Check, Plus } from 'lucide-react';
import Loader from '../../components/Loader';

const calculateBMI = (weightRaw?: string, heightRaw?: string) => {
    if (!weightRaw || !heightRaw) return { value: '--', category: '--', color: 'text-gray-400' };
    
    // Extract numbers, assuming kg and cm for simplicity, or just parsing the first number found
    const weightNum = parseFloat(weightRaw);
    const heightNum = parseFloat(heightRaw);
    
    if (isNaN(weightNum) || isNaN(heightNum) || heightNum === 0) return { value: '--', category: '--', color: 'text-gray-400' };
    
    // Formula: weight(kg) / (height(m) * height(m))
    // If user enters cm (e.g., > 3), convert to meters
    const heightInMeters = heightNum > 3 ? heightNum / 100 : heightNum;
    const bmi = (weightNum / (heightInMeters * heightInMeters)).toFixed(1);
    const bmiNum = parseFloat(bmi);
    
    let category = 'Normal';
    let color = 'text-green-600';
    
    if (bmiNum < 18.5) {
        category = 'Underweight';
        color = 'text-blue-500';
    } else if (bmiNum >= 25 && bmiNum < 30) {
        category = 'Overweight';
        color = 'text-orange-500';
    } else if (bmiNum >= 30) {
        category = 'Obese';
        color = 'text-red-500';
    }
    
    return { value: bmi, category, color };
};

export default function MedicalHistory() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    
    const { data: patient, isLoading: patientLoading } = useGetPatientByIdQuery(patientId!);
    const { data: records, isLoading: recordsLoading, error: recordsError } = useGetPatientMedicalHistoryQuery(patientId!);
    const { data: reports, error: reportsError } = useGetReportsQuery({ patientId });
    const [updateMedicalInfo, { isLoading: isSaving }] = useUpdatePatientMedicalInfoMutation();
    const [deleteRecord, { isLoading: isDeletingRecord }] = useDeleteRecordMutation();
    const [updateRecord] = useUpdateRecordMutation();
    const [deleteReport, { isLoading: isDeletingReport }] = useDeleteReportMutation();
    const { token } = useSelector((state: RootState) => state.auth);

    const [isEditingMedical, setIsEditingMedical] = useState(false);
    const [savedMedical, setSavedMedical] = useState(false);
    const [medicalForm, setMedicalForm] = useState({ allergies: '', chronicConditions: '', weight: '', height: '', habits: { smoking: 'No', alcohol: 'No' } });
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    
    // Inline record editing state
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [successRecordId, setSuccessRecordId] = useState<string | null>(null);
    const [isSavingRecord, setIsSavingRecord] = useState(false);
    const [recordForm, setRecordForm] = useState({
        diagnosis: '',
        treatment: '',
        prescriptions: [] as { medicationName: string; dosage: string; frequency: string; duration: string }[],
        notes: '',
        nextFollowUp: ''
    });

    const startEditingRecord = (record: any) => {
        setRecordForm({
            diagnosis: record.diagnosis,
            treatment: record.treatment,
            prescriptions: Array.isArray(record.prescriptions) ? [...record.prescriptions] : [],
            notes: record.notes || '',
            nextFollowUp: record.nextFollowUp ? new Date(record.nextFollowUp).toISOString().split('T')[0] : ''
        });
        setEditingRecordId(record._id || record.id);
    };

    const addPrescription = () => {
        setRecordForm({
            ...recordForm,
            prescriptions: [...recordForm.prescriptions, { medicationName: '', dosage: '', frequency: '', duration: '' }]
        });
    };

    const removePrescription = (idx: number) => {
        setRecordForm({
            ...recordForm,
            prescriptions: recordForm.prescriptions.filter((_, i) => i !== idx)
        });
    };

    const updatePrescription = (idx: number, field: string, value: string) => {
        const newPrescriptions = [...recordForm.prescriptions];
        newPrescriptions[idx] = { ...newPrescriptions[idx], [field]: value };
        setRecordForm({ ...recordForm, prescriptions: newPrescriptions });
    };

    const cancelEditingRecord = () => {
        setEditingRecordId(null);
    };

    const handleSaveRecord = async (recordId: string) => {
        setIsSavingRecord(true);
        try {
            await updateRecord({
                id: recordId,
                ...recordForm
            }).unwrap();
            setEditingRecordId(null);
            setSuccessRecordId(recordId);
            setTimeout(() => setSuccessRecordId(null), 3000);
        } catch (error) {
            console.error('Failed to update record:', error);
            alert('Failed to update record');
        } finally {
            setIsSavingRecord(false);
        }
    };

    const handleDeleteRecord = async (recordId: string) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            await deleteRecord(recordId).unwrap();
        } catch (error) {
            console.error('Failed to delete record', error);
            alert('Failed to delete record');
        }
    };

    const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await deleteReport(reportId).unwrap();
        } catch (error) {
            console.error('Failed to delete report', error);
            alert('Failed to delete report');
        }
    };

    const handleDownload = async (reportId: string, fileName: string) => {
        try {
            setIsDownloading(reportId);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/${reportId}/download`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download report', error);
            alert('Failed to download report');
        } finally {
            setIsDownloading(null);
        }
    };

    const handleExportPDF = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/${patientId}/export`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `patient_${patientId}_history.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to export PDF', error);
            alert('Failed to export PDF');
        }
    };

    const handleEditMedical = () => {
        setMedicalForm({
            allergies: patient?.allergies || '',
            chronicConditions: (patient as any)?.chronicConditions || '',
            weight: patient?.weight || '',
            height: patient?.height || '',
            habits: {
                smoking: patient?.habits?.smoking || 'No',
                alcohol: patient?.habits?.alcohol || 'No'
            }
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

    // Consent-denied: patient requires explicit approval for this facility
    const isConsentDenied =
        recordsError && 'status' in recordsError && recordsError.status === 403;

    if (isConsentDenied) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => navigate('/patients')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-black text-gray-500 hover:text-primary-600 transition-colors bg-white rounded-xl shadow-sm border border-gray-100"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Patients
                </button>
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-amber-800 text-lg">Access Restricted</h3>
                        <p className="text-amber-700 mt-1 text-sm">
                            This patient has set their sharing preference to <strong>explicit consent only</strong>.
                            Your current facility is not in their list of approved hospitals.
                            The patient must add your facility to their approved list before you can view their records.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return <div>Patient not found</div>;
    }

    const bmiInfo = calculateBMI(patient.weight, patient.height);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Actions */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/patients')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-black text-gray-500 hover:text-primary-600 transition-colors bg-white rounded-xl shadow-sm border border-gray-100"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-black text-white hover:bg-gray-800 transition-colors bg-gray-900 rounded-xl shadow-md border border-gray-700"
                >
                    <FileText className="h-4 w-4" />
                    Export PDF
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
                    <div className="flex items-center gap-4 border-l border-gray-100 pl-6 h-auto flex-wrap md:flex-nowrap py-2">
                        <div className="text-center px-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight (kg)</p>
                            <p className="text-lg font-black text-gray-900">{patient.weight || '--'}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>
                        <div className="text-center px-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Height (cm)</p>
                            <p className="text-lg font-black text-gray-900">{patient.height || '--'}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>
                        <div className="text-center px-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BMI</p>
                            <div className="flex flex-col items-center">
                                <p className={`text-lg font-black ${bmiInfo.color}`}>{bmiInfo.value}</p>
                                {bmiInfo.category !== '--' && (
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${bmiInfo.color} opacity-80`}>
                                        {bmiInfo.category}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>
                        <div className="text-center px-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blood Type</p>
                            <p className="text-lg font-black text-red-600">{patient.bloodType || 'N/A'}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-100 hidden md:block"></div>
                        <div className="text-center px-2">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Weight Card */}
                    <div className="relative p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 block">Weight</label>
                        {isEditingMedical ? (
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={medicalForm.weight}
                                    onChange={(e) => setMedicalForm({ ...medicalForm, weight: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
                                    placeholder="70"
                                />
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-2 border border-l-0 border-blue-200 rounded-r-xl">kg</span>
                            </div>
                        ) : (
                            <div className="min-h-[40px] flex items-center">
                                <p className="text-xl font-bold text-blue-800">
                                    {patient.weight ? `${patient.weight} kg` : <span className="text-blue-300 italic text-sm">Not recorded</span>}
                                </p>
                            </div>
                        )}
                        <Scale className="absolute bottom-4 right-4 h-12 w-12 text-blue-500 opacity-5" />
                    </div>

                    {/* Height Card */}
                    <div className="relative p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 block">Height</label>
                        {isEditingMedical ? (
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={medicalForm.height}
                                    onChange={(e) => setMedicalForm({ ...medicalForm, height: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium"
                                    placeholder="175"
                                />
                                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 border border-l-0 border-emerald-200 rounded-r-xl">cm</span>
                            </div>
                        ) : (
                            <div className="min-h-[40px] flex items-center">
                                <p className="text-xl font-bold text-emerald-800">
                                    {patient.height ? `${patient.height} cm` : <span className="text-emerald-300 italic text-sm">Not recorded</span>}
                                </p>
                            </div>
                        )}
                        <Ruler className="absolute bottom-4 right-4 h-12 w-12 text-emerald-500 opacity-5" />
                    </div>
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
                    </div>
                </div>

                {/* Habits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    {/* Smoking Habit */}
                    <div className="group p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-white transition-colors">
                                    <Cigarette className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Smoking Habit</h4>
                                    <p className="text-xs text-gray-500">Tobacco usage profile</p>
                                </div>
                            </div>
                            {isEditingMedical ? (
                                <select
                                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-xs font-bold"
                                    value={medicalForm.habits.smoking}
                                    onChange={(e) => setMedicalForm({ ...medicalForm, habits: { ...medicalForm.habits, smoking: e.target.value } })}
                                >
                                    <option value="No">Non-Smoker</option>
                                    <option value="Yes">Regular Smoker</option>
                                    <option value="Occasional">Social Smoker</option>
                                    <option value="Former">Former Smoker</option>
                                </select>
                            ) : (
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                    patient.habits?.smoking === 'No' || !patient.habits?.smoking
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : patient.habits?.smoking === 'Yes'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {patient.habits?.smoking || 'Non-Smoker'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Alcohol Habit */}
                    <div className="group p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-white transition-colors">
                                    <Wine className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">Alcohol Consumption</h4>
                                    <p className="text-xs text-gray-500">Drinking frequency</p>
                                </div>
                            </div>
                            {isEditingMedical ? (
                                <select
                                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-xs font-bold"
                                    value={medicalForm.habits.alcohol}
                                    onChange={(e) => setMedicalForm({ ...medicalForm, habits: { ...medicalForm.habits, alcohol: e.target.value } })}
                                >
                                    <option value="No">Abstinent</option>
                                    <option value="Yes">Regular</option>
                                    <option value="Occasional">Social</option>
                                    <option value="Former">Former</option>
                                </select>
                            ) : (
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                    patient.habits?.alcohol === 'No' || !patient.habits?.alcohol
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : patient.habits?.alcohol === 'Yes'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {patient.habits?.alcohol || 'Abstinent'}
                                </span>
                            )}
                        </div>
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
                        {records.map((record: any) => (
                            <div key={record._id || record.id} className="relative pl-16 pb-12 group last:pb-0">
                                <div className="absolute left-4 top-1 h-4 w-4 rounded-full bg-white border-4 border-primary-500 z-10 group-hover:scale-125 transition-transform"></div>
                                
                                {editingRecordId === (record._id || record.id) ? (
                                    // Inline Edit Form
                                    <div className="bg-white p-6 rounded-2xl border-2 border-primary-400 shadow-md ring-4 ring-primary-50 transition-all">
                                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                                <Pencil className="h-4 w-4 text-primary-500" />
                                                Editing Record
                                            </h4>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-gray-900">{record.date}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Diagnosis</label>
                                                <input
                                                    type="text"
                                                    value={recordForm.diagnosis}
                                                    onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-bold text-lg"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Treatment Plan</label>
                                                    <textarea
                                                        value={recordForm.treatment}
                                                        onChange={(e) => setRecordForm({ ...recordForm, treatment: e.target.value })}
                                                        rows={3}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm font-medium text-gray-700"
                                                    />
                                                </div>
                                                <div className="col-span-1 md:col-span-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Prescribed Medication</label>
                                                        <button type="button" onClick={addPrescription} className="text-[10px] font-black px-2 py-1 bg-blue-50 text-blue-600 rounded flex items-center hover:bg-blue-100 transition-colors">
                                                            <Plus className="h-3 w-3 mr-1" /> Add Medication
                                                        </button>
                                                    </div>
                                                    
                                                    {recordForm.prescriptions.length === 0 ? (
                                                        <div className="text-xs text-gray-500 italic py-3 text-center border border-dashed border-gray-200 rounded-lg">No prescriptions added.</div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {recordForm.prescriptions.map((px, idx) => (
                                                                <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-blue-50/30 p-2 rounded border border-blue-100">
                                                                    <input 
                                                                        type="text" placeholder="Medication" 
                                                                        value={px.medicationName} onChange={e => updatePrescription(idx, 'medicationName', e.target.value)}
                                                                        className="w-full sm:flex-1 px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" 
                                                                    />
                                                                    <input 
                                                                        type="text" placeholder="Dosage" 
                                                                        value={px.dosage} onChange={e => updatePrescription(idx, 'dosage', e.target.value)}
                                                                        className="w-full sm:flex-1 px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" 
                                                                    />
                                                                    <input 
                                                                        type="text" placeholder="Frequency" 
                                                                        value={px.frequency} onChange={e => updatePrescription(idx, 'frequency', e.target.value)}
                                                                        className="w-full sm:flex-1 px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" 
                                                                    />
                                                                    <input 
                                                                        type="text" placeholder="Duration" 
                                                                        value={px.duration} onChange={e => updatePrescription(idx, 'duration', e.target.value)}
                                                                        className="w-full sm:flex-1 px-2 py-1.5 bg-white border border-blue-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" 
                                                                    />
                                                                    <button type="button" onClick={() => removePrescription(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Observations / Notes</label>
                                                <textarea
                                                    value={recordForm.notes}
                                                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                                                    rows={2}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm italic text-gray-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1 block">Next Follow-up Date</label>
                                                <input
                                                    type="date"
                                                    value={recordForm.nextFollowUp || ''}
                                                    onChange={(e) => setRecordForm({ ...recordForm, nextFollowUp: e.target.value })}
                                                    className="w-full px-4 py-2 bg-primary-50 border border-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-gray-900 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={cancelEditingRecord}
                                                className="px-4 py-2 text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                                            >
                                                <X className="h-3.5 w-3.5" /> Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveRecord(record._id || record.id)}
                                                disabled={isSavingRecord || !recordForm.diagnosis || !recordForm.treatment}
                                                className="px-6 py-2 text-xs font-black text-white uppercase tracking-widest bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                            >
                                                {isSavingRecord ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} 
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Default View Mode
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all group-hover:border-primary-100">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Diagnosis</p>
                                                    <h4 className="text-lg font-black text-gray-900 leading-tight">{record.diagnosis}</h4>
                                                </div>
                                                {successRecordId === (record._id || record.id) && (
                                                    <span className="flex items-center px-2 py-1 bg-green-100 rounded-lg text-[10px] font-black text-green-700 uppercase tracking-tight animate-pulse ml-2">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Saved
                                                    </span>
                                                )}
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
                                                 <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-line">{record.treatment}</p>
                                            </div>
                                            {record.prescriptions && Array.isArray(record.prescriptions) && record.prescriptions.length > 0 && (
                                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-50 md:col-span-2">
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Prescribed Medication</p>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full text-sm text-left align-middle border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-blue-200/50 text-xs text-blue-800 font-bold">
                                                                    <th className="pb-2 pr-3 font-semibold">Medication</th>
                                                                    <th className="pb-2 px-3 font-semibold">Dosage</th>
                                                                    <th className="pb-2 px-3 font-semibold">Frequency</th>
                                                                    <th className="pb-2 pl-3 font-semibold">Duration</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-blue-900 font-medium">
                                                                {record.prescriptions.map((px: any, i: number) => (
                                                                    <tr key={i} className="border-b border-blue-100/50 last:border-0">
                                                                        <td className="py-2 pr-3">{px.medicationName}</td>
                                                                        <td className="py-2 px-3">{px.dosage}</td>
                                                                        <td className="py-2 px-3">{px.frequency}</td>
                                                                        <td className="py-2 pl-3">{px.duration}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {record.notes && (
                                            <div className="mt-6 pt-4 border-t border-gray-50">
                                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observations</p>
                                                 <p className="text-sm text-gray-500 italic leading-relaxed whitespace-pre-line">{record.notes}</p>
                                            </div>
                                        )}
                                         <div className="mt-6 flex flex-col gap-2">
                                             <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <User className="h-3 w-3 mr-1.5" />
                                                Consulting MD: Dr. {record.doctorId?.name || record.doctorName || 'Unknown'}
                                             </div>
                                             <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <Activity className="h-3 w-3 mr-1.5" />
                                                Facility: {record.hospitalId?.name || record.hospitalName || 'Unknown Facility'}
                                             </div>
                                             
                                             <div className="flex items-center justify-between mt-4">
                                                 <div className="flex items-center gap-2">
                                                     {record.nextFollowUp && (
                                                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 shadow-sm">
                                                            <Activity className="h-3 w-3" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Next Follow-up: {new Date(record.nextFollowUp).toLocaleDateString()}</span>
                                                        </div>
                                                     )}
                                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100">
                                                        Official Record
                                                     </span>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEditingRecord(record)}
                                                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest outline-none hover:text-primary-600 transition-colors flex items-center gap-1"
                                                    >
                                                        <Pencil className="h-3 w-3" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRecord(record._id || record.id)}
                                                        disabled={isDeletingRecord}
                                                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest outline-none hover:text-red-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3 w-3" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                        {reports.map(report => {
                            const reportId = report.id || (report as any)._id;
                            return (
                                <div key={reportId} className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer overflow-hidden">
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
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDownload(reportId, report.fileName);
                                                }}
                                                disabled={isDownloading === reportId}
                                                className="text-[10px] font-black text-primary-600 uppercase tracking-widest underline-offset-4 hover:underline disabled:opacity-50"
                                            >
                                                {isDownloading === reportId ? 'Downloading...' : 'Download'}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteReport(reportId, e)}
                                                disabled={isDeletingReport}
                                                className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                                                title="Delete report"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Removed EditMedicalRecordModal component rendering */}
        </div>
    );
}

