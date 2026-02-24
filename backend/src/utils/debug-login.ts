import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config();

const debugLogin = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected.');

        const email = 'patient@example.com';
        const password = 'patient123';

        console.log(`Looking for user: ${email}`);
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.log('User NOT FOUND in DB.');
            process.exit(1);
        }

        console.log('User found.');
        console.log(`Stored Hash: ${user.password}`);

        console.log(`comparing '${password}' with hash...`);
        const isMatch = await bcrypt.compare(password, user.password);

        console.log(`Match Result: ${isMatch}`);

        if (!isMatch) {
            console.log('--- ATTEMPTING FIX ---');
            console.log('Manually checking direct hash...');
            const testHash = await bcrypt.hash(password, 10);
            console.log(`New Hash for comparison would be: ${testHash}`);

            // Try to update user manually
            user.password = password; // Middleware should hash this
            await user.save();
            console.log('User saved with new password (triggering save middleware).');

            const userRefetch = await User.findOne({ email }).select('+password');
            console.log(`New Stored Hash: ${userRefetch?.password}`);
            const isMatchNew = await bcrypt.compare(password, userRefetch?.password || '');
            console.log(`Match Result after fix: ${isMatchNew}`);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugLogin();
