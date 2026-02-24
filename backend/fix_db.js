
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const userSchema = new mongoose.Schema({
    email: String,
    name: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

const fixUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-record-system');
        console.log('Connected to MongoDB');
        
        // 1. Fix Admin
        const admin = await User.findOneAndUpdate(
            { role: 'admin' }, 
            { email: 'admin@medicare.com' },
            { new: true }
        );
        console.log('Updated Admin:', admin?.email);

        // 2. Fix Dr. John Smith
        const doc1 = await User.findOneAndUpdate(
            { name: 'Dr. John Smith' }, 
            { email: 'john@medicare.com' },
            { new: true }
        );
        console.log('Updated Dr. John:', doc1?.email);

        // 3. Fix Michael Brown
        const pat1 = await User.findOneAndUpdate(
            { name: 'Michael Brown' }, 
            { email: 'michael@example.com' },
            { new: true }
        );
        console.log('Updated Michael:', pat1?.email);

        console.log('Database updated to match README credentials.');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

fixUsers();
