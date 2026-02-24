export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'doctor' | 'patient';
    phone?: string;
    createdAt?: string;
}

export interface Patient {
    id: string;
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    bloodType?: string;
    allergies?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    createdAt: string;
}

export interface MedicalRecord {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    date: string;
    diagnosis: string;
    treatment: string;
    prescriptions?: string;
    notes?: string;
    createdAt: string;
}

export interface Report {
    id: string;
    patientId: string;
    patientName: string;
    recordId?: string;
    doctorId?: string;
    doctorName?: string;
    uploadedBy?: string;
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
    role: 'doctor' | 'patient';
    phone?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    reason: string;
    notes?: string;
}
