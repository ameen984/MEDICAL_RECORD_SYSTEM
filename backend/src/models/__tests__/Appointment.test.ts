import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Appointment from '../Appointment';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

describe('Appointment Model Test', () => {
    it('create & save appointment successfully', async () => {
        const patientId = new mongoose.Types.ObjectId();
        const doctorId = new mongoose.Types.ObjectId();
        const hospitalId = new mongoose.Types.ObjectId();
        const date = new Date(Date.now() + 86400000); // tomorrow

        const appointmentData = {
            patientId,
            doctorId,
            hospitalId,
            date,
            status: 'scheduled',
            reason: 'Routine checkup'
        };

        const validAppointment = new Appointment(appointmentData);
        const savedAppointment = await validAppointment.save();

        expect(savedAppointment._id).toBeDefined();
        expect(savedAppointment.patientId.toString()).toBe(appointmentData.patientId.toString());
        expect(savedAppointment.status).toBe('scheduled');
        expect(savedAppointment.reason).toBe('Routine checkup');
    });

    it('insert appointment successfully, but the field not defined in schema should be undefined', async () => {
        const appointmentWithInvalidField = new Appointment({
            patientId: new mongoose.Types.ObjectId(),
            doctorId: new mongoose.Types.ObjectId(),
            date: new Date(),
            reason: 'Checkup',
            extraField: 'Should not map to schema'
        });
        const savedAppointment = await appointmentWithInvalidField.save();
        expect(savedAppointment._id).toBeDefined();
        expect((savedAppointment as any).extraField).toBeUndefined();
    });

    it('create appointment without required field should failed', async () => {
        const appointmentWithoutRequiredField = new Appointment({ reason: 'Checkup' });
        let err: any;
        try {
            await appointmentWithoutRequiredField.save();
        } catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.patientId).toBeDefined();
        expect(err.errors.doctorId).toBeDefined();
        expect(err.errors.date).toBeDefined();
    });
});
