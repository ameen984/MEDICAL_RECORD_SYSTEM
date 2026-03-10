import { Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';

// @desc    Get recent activity logs
// @route   GET /api/activity
// @access  Private/Admin
export const getActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
        const filter = req.user?.role === 'admin' ? { hospitalId: { $in: req.user.hospitalIds || [] } } : {};

        const logs = await ActivityLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Helper function to create a log entry
export const createActivityLog = async (logData: {
    user: any;
    userName: string;
    action: string;
    details: string;
    targetUser?: any;
    targetUserName?: string;
    hospitalId?: any; // To scope the log to a given hospital
}) => {
    try {
        await ActivityLog.create(logData);
    } catch (error) {
        console.error('Failed to create activity log:', error);
    }
};
