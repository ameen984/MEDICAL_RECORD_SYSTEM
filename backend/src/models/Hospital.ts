import mongoose, { Document, Schema } from 'mongoose';

export interface IHospital extends Document {
    name: string;
    address?: string;
    contactEmail?: string;
    phone?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
}

const hospitalSchema = new Schema<IHospital>({
    name: {
        type: String,
        required: [true, 'Please provide a hospital name'],
        trim: true,
        unique: true,
    },
    address: {
        type: String,
        trim: true,
    },
    contactEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IHospital>('Hospital', hospitalSchema);
