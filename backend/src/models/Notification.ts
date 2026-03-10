import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'report' | 'consent' | 'security';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    message: string;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: ['report', 'consent', 'security'], required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
