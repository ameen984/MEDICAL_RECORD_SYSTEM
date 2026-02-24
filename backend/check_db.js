
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const userSchema = new mongoose.Schema({
    email: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-record-system');
        console.log('Connected to MongoDB');
        
        const count = await User.countDocuments();
        console.log(`Total Users: ${count}`);
        
        if (count > 0) {
            const users = await User.find({}, 'name email role');
            console.log('--- ACTUAL USERS IN DB ---');
            users.forEach(u => console.log(`${u.role}: ${u.email} (${u.name})`));
            console.log('--------------------------');
        } else {
            console.log('No users found. Database needs seeding.');
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkUsers();
