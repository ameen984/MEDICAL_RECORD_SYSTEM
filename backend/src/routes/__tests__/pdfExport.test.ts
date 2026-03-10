import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../server';
import Patient from '../../models/Patient';

let mongoServer: MongoMemoryServer;
let doctorToken: string;
let patientId: mongoose.Types.ObjectId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a doctor
    const docRes = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Doctor PDF',
            email: 'doctorpdf@test.com',
            password: 'password123',
            role: 'doctor'
        });
    doctorToken = docRes.body.data.token;

    // Create a patient
    const patient = new Patient({
        name: 'Test Patient PDF',
        email: 'patientpdf@test.com',
        userId: new mongoose.Types.ObjectId()
    });
    await patient.save();
    patientId = patient._id as mongoose.Types.ObjectId;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('GET /api/patients/:id/export', () => {
    it('should generate and return a PDF file', async () => {
        const response = await request(app)
            .get(`/api/patients/${patientId}/export`)
            .set('Authorization', `Bearer ${doctorToken}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('application/pdf');
    });
});
