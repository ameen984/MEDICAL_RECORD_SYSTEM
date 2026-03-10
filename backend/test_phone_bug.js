const mongoose = require('mongoose');
const User = require('./src/models/User').default;
const dotenv = require('dotenv');

dotenv.config();

async function testPut() {
    await mongoose.connect('mongodb://localhost:27017/medical-record-system');
    
    try {
        console.log("Testing with empty string for phone...");
        const users = await User.find({ role: 'patient' }).limit(2);
        
        if (users.length < 2) {
             console.log("Need at least 2 patients to test unique empty string conflict.");
             process.exit();
        }

        // Set the first patient to empty string
        await User.findByIdAndUpdate(users[0]._id, { phone: "" }, { new: true, runValidators: true });
        console.log("First user updated to empty string.");

        // Set the second patient to empty string
        await User.findByIdAndUpdate(users[1]._id, { phone: "" }, { new: true, runValidators: true });
        console.log("Second user updated to empty string. IT WORKED.");

    } catch (e) {
        console.error("Error during update:", e.message);
    }
    
    process.exit();
}

testPut();
