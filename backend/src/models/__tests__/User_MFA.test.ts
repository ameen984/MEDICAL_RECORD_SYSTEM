import mongoose from 'mongoose';
import User from '../User';
import speakeasy from 'speakeasy';

describe('User Model MFA fields', () => {
    it('should save a user with mfaSecret and isMfaEnabled', async () => {
        const mockSecret = speakeasy.generateSecret().base32;

        const user = new User({
            name: 'MFA User',
            email: 'mfa@test.com',
            password: 'password123',
            role: 'doctor',
            mfaSecret: mockSecret,
            isMfaEnabled: true
        });

        const error = user.validateSync();
        expect(error).toBeUndefined();
        expect(user.mfaSecret).toBe(mockSecret);
        expect(user.isMfaEnabled).toBe(true);
    });

    it('should default isMfaEnabled to false', async () => {
        const user = new User({
            name: 'Non MFA User',
            email: 'nomfa@test.com',
            password: 'password123',
            role: 'patient',
        });

        const error = user.validateSync();
        expect(error).toBeUndefined();
        expect(user.isMfaEnabled).toBe(false);
        expect(user.mfaSecret).toBeUndefined();
    });
});
