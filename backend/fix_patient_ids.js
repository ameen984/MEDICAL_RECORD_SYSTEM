const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const reportSchema = new mongoose.Schema({ patientId: mongoose.Schema.Types.ObjectId });
const recordSchema = new mongoose.Schema({ patientId: mongoose.Schema.Types.ObjectId });
const patientSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId });

const Report = mongoose.model('Report', reportSchema);
const Record = mongoose.model('MedicalRecord', recordSchema);
const Patient = mongoose.model('Patient', patientSchema);

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-record-system');
        console.log('Connected to MongoDB');
        
        const patients = await Patient.find({});
        console.log(`Found ${patients.length} patient records.`);
        
        for (const p of patients) {
            console.log(`Checking patient record: ${p._id} (belongs to user: ${p.userId})`);
            
            // Fix Reports
            const reportUpdate = await Report.updateMany(
                { patientId: p._id },
                { $set: { patientId: p.userId } }
            );
            if (reportUpdate.modifiedCount > 0) {
                console.log(`Updated ${reportUpdate.modifiedCount} reports for this patient.`);
            }
            
            // Fix Medical Records
            const recordUpdate = await Record.updateMany(
                { patientId: p._id },
                { $set: { patientId: p.userId } }
            );
            if (recordUpdate.modifiedCount > 0) {
                console.log(`Updated ${recordUpdate.modifiedCount} records for this patient.`);
            }
        }
        
        console.log('Migration completed.');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

fix();
