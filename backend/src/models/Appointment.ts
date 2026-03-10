import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    hospitalId: mongoose.Types.ObjectId;
    date: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
    reason: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide the patient ID'],
        index: true,
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide the doctor ID'],
    },
    hospitalId: {
        type: Schema.Types.ObjectId,
        ref: 'Hospital',
        required: [false, 'Hospital ID is optional but recommended'],
    },
    date: {
        type: Date,
        required: [true, 'Please provide the date and time of the appointment'],
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled',
        index: true,
    },
    reason: {
        type: String,
        required: [true, 'Please provide the reason for the appointment'],
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

// Indexes for faster queries
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ doctorId: 1, date: -1 });
appointmentSchema.index({ hospitalId: 1 });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
