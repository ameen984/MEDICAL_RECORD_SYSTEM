import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    user: mongoose.Types.ObjectId;
    userName: string;
    action: 'LOGIN' | 'LOGOUT' | 'SIGNUP' | 'ROLE_CHANGE' | 'USER_DELETE' | 'PROFILE_UPDATE' | 'SECURITY_ALERT' | 'RECORD_ACCESS' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_ACTIVATED' | 'CREATED_HOSPITAL' | 'UPDATED_HOSPITAL' | 'DELETED_HOSPITAL' | 'REPORT_UPLOAD' | 'RECORD_CREATED' | 'RECORD_UPDATED' | 'CONSENT_CHANGED' | 'PASSWORD_RESET' | 'MFA_ENABLED' | 'MFA_DISABLED';
    details: string;
    targetUser?: mongoose.Types.ObjectId;
    targetUserName?: string;
    hospitalId?: mongoose.Types.ObjectId;
    oldState?: any;
    newState?: any;
    timestamp: Date;
}

const ActivityLogSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['LOGIN', 'LOGOUT', 'SIGNUP', 'ROLE_CHANGE', 'USER_DELETE', 'PROFILE_UPDATE', 'SECURITY_ALERT', 'RECORD_ACCESS', 'ACCOUNT_SUSPENDED', 'ACCOUNT_ACTIVATED', 'CREATED_HOSPITAL', 'UPDATED_HOSPITAL', 'DELETED_HOSPITAL', 'REPORT_UPLOAD', 'RECORD_CREATED', 'RECORD_UPDATED', 'CONSENT_CHANGED', 'PASSWORD_RESET', 'MFA_ENABLED', 'MFA_DISABLED'],
        index: true
    },
    details: {
        type: String,
        required: true
    },
    targetUser: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    targetUserName: {
        type: String
    },
    hospitalId: {
        type: Schema.Types.ObjectId,
        ref: 'Hospital'
    },
    oldState: {
        type: Schema.Types.Mixed
    },
    newState: {
        type: Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
