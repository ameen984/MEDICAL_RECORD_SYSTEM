import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRecord extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    date: Date;
    diagnosis: string;
    treatment: string;
    prescriptions?: string;
    notes?: string;
    createdAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    diagnosis: {
        type: String,
        required: [true, 'Please provide a diagnosis'],
    },
    treatment: {
        type: String,
        required: [true, 'Please provide treatment information'],
    },
    prescriptions: {
        type: String,
    },
    notes: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for faster queries
medicalRecordSchema.index({ patientId: 1, date: -1 });
medicalRecordSchema.index({ doctorId: 1 });

export default mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
