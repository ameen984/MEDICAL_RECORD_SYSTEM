import mongoose from 'mongoose';
import ActivityLog from '../ActivityLog';

describe('ActivityLog Model - Granular Audits', () => {
    it('should save an activity log with oldState and newState objects', async () => {
        const log = new ActivityLog({
            user: new mongoose.Types.ObjectId(),
            userName: 'Test User',
            action: 'PROFILE_UPDATE',
            details: 'User updated profile',
            oldState: { email: 'old@example.com', phone: '123' },
            newState: { email: 'new@example.com', phone: '456' }
        });

        const error = log.validateSync();
        expect(error).toBeUndefined();
        expect(log.oldState).toBeDefined();
        expect(log.oldState?.email).toBe('old@example.com');
        expect(log.newState?.phone).toBe('456');
    });

    it('should allow oldState and newState to be optional', async () => {
        const log = new ActivityLog({
            user: new mongoose.Types.ObjectId(),
            userName: 'Test User',
            action: 'LOGIN',
            details: 'User logged in'
        });

        const error = log.validateSync();
        expect(error).toBeUndefined();
        expect(log.oldState).toBeUndefined();
    });
});
