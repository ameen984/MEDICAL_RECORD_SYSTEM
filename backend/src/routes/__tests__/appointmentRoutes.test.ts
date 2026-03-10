import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server';
import User from '../../models/User';

let mongoServer: MongoMemoryServer;
let patientToken: string;
let doctorId: mongoose.Types.ObjectId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a patient and get token
    const patientRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Test Patient',
            email: 'patient@test.com',
            password: 'password123',
            role: 'patient'
        });
    patientToken = patientRes.body.data.token;

    // Create a doctor
    const doctor = await User.create({
        name: 'Dr. Smith',
        email: 'doctor@test.com',
        password: 'password123',
        role: 'doctor'
    });
    doctorId = (doctor._id as mongoose.Types.ObjectId);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        if (key !== 'users') { // Keep users for auth
            await collections[key].deleteMany({});
        }
    }
});

describe('Appointment Routes', () => {
    describe('POST /api/appointments', () => {
        it('should create an appointment when provided valid data', async () => {
            const date = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

            const response = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    doctorId: doctorId.toString(),
                    date,
                    reason: 'Follow up'
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reason).toBe('Follow up');
            expect(response.body.data.patientId).toBeDefined();
        });
    });

    describe('GET /api/appointments', () => {
        it('should get all appointments for the logged in user', async () => {
            const response = await request(app)
                .get('/api/appointments')
                .set('Authorization', `Bearer ${patientToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('PATCH /api/appointments/:id', () => {
        it('should update appointment status', async () => {
            // First create an appointment
            const date = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
            const createRes = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({ doctorId: doctorId.toString(), date, reason: 'Follow up' });

            const appointmentId = createRes.body.data._id;

            const response = await request(app)
                .patch(`/api/appointments/${appointmentId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .send({ status: 'cancelled' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('cancelled');
        });
    });
});
