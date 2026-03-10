import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server';
import User from '../../models/User';
import speakeasy from 'speakeasy';

let mongoServer: MongoMemoryServer;
let adminToken: string;
let adminId: mongoose.Types.ObjectId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create an admin
    const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Admin User',
            email: 'adminmfa@test.com',
            password: 'password123',
            role: 'admin'
        });
    adminToken = adminRes.body.data.token;
    adminId = adminRes.body.data.user.id;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    // keeping users intact for tokens
});

describe('MFA Routes', () => {
    let mfaSecret: string;

    describe('POST /api/auth/mfa/setup', () => {
        it('should generate an MFA secret and return a QR code', async () => {
            const response = await request(app)
                .post('/api/auth/mfa/setup')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.qrCodeUrl).toBeDefined();
            expect(response.body.data.secret).toBeDefined();
            mfaSecret = response.body.data.secret;
        });
    });

    describe('POST /api/auth/mfa/verify', () => {
        it('should verify OTP and enable MFA for user', async () => {
            // Generate valid OTP for the test
            const token = speakeasy.totp({
                secret: mfaSecret,
                encoding: 'base32'
            });

            const response = await request(app)
                .post('/api/auth/mfa/verify')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ token });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Check that DB was updated
            const updatedUser = await User.findById(adminId);
            expect(updatedUser?.isMfaEnabled).toBe(true);
            expect(updatedUser?.mfaSecret).toBe(mfaSecret);
        });
    });
});
