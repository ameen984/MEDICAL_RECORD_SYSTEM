import mongoose from 'mongoose';
import User from '../User';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
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

describe('User Model', () => {
    test('should allow creating a user with super_admin role', async () => {
        const userData = {
            name: 'Network Operator',
            email: 'operator@network.com',
            password: 'password123',
            role: 'super_admin'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser._id).toBeDefined();
        expect(savedUser.role).toBe('super_admin');
    });

    test('should fail if an invalid role is provided', async () => {
        const invalidUserData = {
            name: 'Hacker',
            email: 'hacker@network.com',
            password: 'password123',
            role: 'god_mode' // Invalid role
        };

        const user = new User({ ...invalidUserData, role: invalidUserData.role as any });

        let err: any;
        try {
            await user.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.role).toBeDefined();
    });
});
