
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-record-system');
        console.log('Connected to MongoDB');

        const count = await User.countDocuments();
        console.log(`Total Users: ${count}`);

        if (count > 0) {
            const users = await User.find({}, 'email role');
            console.log('Existing Users:', users);
        } else {
            console.log('No users found. Database needs seeding.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkUsers();
