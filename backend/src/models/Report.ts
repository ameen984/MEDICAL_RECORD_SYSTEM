import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId?: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    recordId?: mongoose.Types.ObjectId;
    type: 'lab' | 'scan' | 'prescription' | 'other';
    title: string;
    fileName: string;
    filePath: string;
    uploadDate: Date;
}

const reportSchema = new Schema<IReport>({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Now optional
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Track who uploaded it
    },
    recordId: {
        type: Schema.Types.ObjectId,
        ref: 'MedicalRecord',
    },
    type: {
        type: String,
        enum: ['lab', 'scan', 'prescription', 'other'],
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Please provide a report title'],
    },
    fileName: {
        type: String,
        required: true,
    },
    filePath: {
        type: String,
        required: true,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
});

// Indexes
reportSchema.index({ patientId: 1 });
reportSchema.index({ doctorId: 1 });
reportSchema.index({ type: 1 });

export default mongoose.model<IReport>('Report', reportSchema);
