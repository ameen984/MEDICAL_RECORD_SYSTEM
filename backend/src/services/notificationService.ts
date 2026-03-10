import mongoose from 'mongoose';
import Notification, { NotificationType } from '../models/Notification';
import User from '../models/User';
import { emitToUser, broadcastToRole } from './socketService';

/**
 * Persist a notification for a single user AND emit the socket event to them.
 */
export const notifyUser = async (
    userId: string | mongoose.Types.ObjectId,
    type: NotificationType,
    message: string,
    socketPayload: Record<string, any> = {}
) => {
    await Notification.create({ userId, type, message });
    emitToUser(userId.toString(), type === 'report' ? 'NEW_REPORT' : type === 'consent' ? 'CONSENT_CHANGED' : 'SECURITY_ALERT', { message, ...socketPayload });
};

/**
 * Persist notifications for every user with a given role AND broadcast the socket event.
 */
export const notifyRole = async (
    role: string,
    type: NotificationType,
    message: string,
    socketPayload: Record<string, any> = {}
) => {
    const users = await User.find({ role, isActive: true }).select('_id');
    if (users.length > 0) {
        await Notification.insertMany(
            users.map(u => ({ userId: u._id, type, message }))
        );
    }
    const event = type === 'report' ? 'NEW_REPORT' : type === 'consent' ? 'CONSENT_CHANGED' : 'SECURITY_ALERT';
    broadcastToRole(role, event, { message, ...socketPayload });
};
