import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
    userId: mongoose.Types.ObjectId;
    dateOfBirth?: Date;
    bloodType?: string;
    allergies?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    height?: string;
    weight?: string;
    habits?: {
        smoking: 'Yes' | 'No' | 'Occasional' | 'Former';
        alcohol: 'Yes' | 'No' | 'Occasional' | 'Former';
    };
    chronicConditions?: string;
}

const patientSchema = new Schema<IPatient>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    dateOfBirth: {
        type: Date,
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    },
    allergies: {
        type: String,
        default: 'None',
    },
    address: {
        type: String,
    },
    emergencyContact: {
        type: String,
    },
    emergencyPhone: {
        type: String,
    },
    height: {
        type: String, // e.g., "180 cm"
    },
    weight: {
        type: String, // e.g., "75 kg"
    },
    habits: {
        smoking: { type: String, enum: ['Yes', 'No', 'Occasional', 'Former'], default: 'No' },
        alcohol: { type: String, enum: ['Yes', 'No', 'Occasional', 'Former'], default: 'No' },
    },
    chronicConditions: {
        type: String, // e.g., "Diabetes, Hypertension"
        default: 'None',
    },
}, {
    timestamps: true,
});

// Index for faster queries handled by unique: true on userId field

export default mongoose.model<IPatient>('Patient', patientSchema);
