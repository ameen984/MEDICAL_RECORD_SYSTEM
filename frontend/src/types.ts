export interface User {
    id: string;
    _id?: string;
    name: string;
    email?: string;
    role: 'super_admin' | 'admin' | 'doctor' | 'patient';
    isActive?: boolean;
    isMfaEnabled?: boolean;
    hospitalIds?: (string | Hospital)[];
    phone?: string;
    createdAt?: string;
}

export interface Hospital {
    _id?: string;
    id?: string;
    name: string;
    address?: string;
    contactEmail?: string;
    phone?: string;
    status: 'active' | 'inactive';
    createdAt?: string;
}

export interface ActivityLog {
    _id?: string;
    action: string;
    details: string;
    userName: string;
    targetUserName?: string;
    timestamp: string;
}

export interface Patient {
    id: string;
    _id?: string;
    name: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    bloodType?: string;
    height?: string;
    weight?: string;
    allergies?: string;
    chronicConditions?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    habits?: {
        smoking?: 'Yes' | 'No' | 'Occasional' | 'Former';
        alcohol?: 'Yes' | 'No' | 'Occasional' | 'Former';
    };
    sharingPreference?: 'global' | 'explicit';
    approvedHospitals?: string[] | any[]; // any[] to handle populated Hospital objects
    createdAt: string;
}

export interface MedicalRecord {
    id: string;
    _id?: string;
    patientId: string | any;
    patientName?: string;
    doctorId: string | any;
    doctorName?: string;
    hospitalId?: string | any;
    hospitalName?: string;
    date: string;
    diagnosis: string;
    treatment: string;
    prescriptions?: {
        medicationName: string;
        dosage: string;
        frequency: string;
        duration: string;
    }[];
    notes?: string;
    nextFollowUp?: string;
    createdAt: string;
}

export interface Report {
    id: string;
    patientId: string | any;
    patientName: string;
    recordId?: string;
    doctorId?: string | any;
    doctorName?: string;
    uploadedBy?: string | any;
    hospitalId?: string | any;
    hospitalName?: string;
    type: 'lab' | 'scan' | 'prescription' | 'other';
    title: string;
    fileName: string;
    fileUrl: string;
    uploadDate: string;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'doctor' | 'patient';
    phone?: string;
    hospitalIds?: string[];
}

export interface Appointment {
    id: string;
    _id?: string;
    patientId: string | any;
    doctorId: string | any;
    hospitalId?: string | any;
    date: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    reason: string;
    notes?: string;
    createdAt?: string;
}
