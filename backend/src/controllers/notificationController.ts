import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

// @desc    Get notifications for the current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await Notification.find({ userId: req.user!._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markOneRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid notification id' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.user!._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllRead = async (req: AuthRequest, res: Response) => {
    try {
        await Notification.updateMany({ userId: req.user!._id, read: false }, { read: true });
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
