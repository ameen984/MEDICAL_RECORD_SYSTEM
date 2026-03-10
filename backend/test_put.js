const mongoose = require('mongoose');
const User = require('./src/models/User').default;
const Patient = require('./src/models/Patient').default;
const dotenv = require('dotenv');

dotenv.config();

async function testPut() {
    await mongoose.connect('mongodb://localhost:27017/medical-record-system');
    
    // Find a patient
    const patientUser = await User.findOne({ role: 'patient' });
    if (!patientUser) {
        console.log("No patient found");
        process.exit();
    }
    
    console.log("Found patient:", patientUser._id);
    
    // Mock the payload
    const payload = {
        name: patientUser.name,
        phone: patientUser.phone || '1234567890',
        sharingPreference: 'explicit',
        approvedHospitals: []
    };
    
    try {
        const user = await User.findByIdAndUpdate(
            patientUser._id,
            { name: payload.name, phone: payload.phone },
            { new: true, runValidators: true }
        );
        
        console.log("User updated:", !!user);
        
        const patientInfo = await Patient.findOneAndUpdate(
            { userId: user._id },
            { sharingPreference: payload.sharingPreference, approvedHospitals: payload.approvedHospitals },
            { new: true, runValidators: true, upsert: true }
        );
        
        console.log("Patient info updated:", !!patientInfo);
        console.log("Success");
    } catch (e) {
        console.error("Error during update:", e);
    }
    
    process.exit();
}

testPut();
