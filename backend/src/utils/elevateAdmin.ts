import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';

dotenv.config();

const migrateToSuperAdmin = async () => {
    try {
        await connectDB();

        console.log('Connected to database...');

        // Find the absolute first admin created in the system and elevate them
        const firstAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });

        if (!firstAdmin) {
            console.log('No admin found to elevate.');
            process.exit(0);
        }

        firstAdmin.role = 'super_admin';
        await firstAdmin.save();

        console.log(`Successfully elevated ${firstAdmin.email} to super_admin!`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateToSuperAdmin();
