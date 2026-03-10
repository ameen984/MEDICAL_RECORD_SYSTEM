import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
    name: string;
    email?: string;
    password: string;
    role: 'super_admin' | 'admin' | 'doctor' | 'patient';
    isActive: boolean;
    hospitalIds?: mongoose.Types.ObjectId[];
    phone?: string;
    isMfaEnabled: boolean;
    mfaSecret?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    // Google OAuth
    googleId?: string;
    emailVerified: boolean;
    // Phone OTP verification
    phoneVerified: boolean;
    phoneOtp?: string;
    phoneOtpExpire?: Date;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'doctor', 'patient'],
        default: 'patient',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    hospitalIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Hospital',
    }],
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    isMfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    googleId: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String, select: false },
    phoneOtpExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving (skip for Google OAuth users who have no password)
userSchema.pre('save', async function (next) {
    if (!this.password || !this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function (): string {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

export default mongoose.model<IUser>('User', userSchema);
