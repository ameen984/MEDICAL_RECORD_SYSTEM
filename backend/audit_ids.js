const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const reportSchema = new mongoose.Schema({ patientId: mongoose.Schema.Types.ObjectId }, { strict: false });
const recordSchema = new mongoose.Schema({ patientId: mongoose.Schema.Types.ObjectId }, { strict: false });
const patientSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { strict: false });
const userSchema = new mongoose.Schema({ name: String }, { strict: false });

const Report = mongoose.model('Report', reportSchema);
const Record = mongoose.model('MedicalRecord', recordSchema);
const Patient = mongoose.model('Patient', patientSchema);
const User = mongoose.model('User', userSchema);

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-record-system');
        
        const reports = await Report.find({});
        console.log(`Reports: ${reports.length}`);
        for (const r of reports) {
            const isUser = await User.exists({ _id: r.patientId });
            const isPatient = await Patient.exists({ _id: r.patientId });
            console.log(`Report "${r.title || r._id}": ${isUser ? 'USER ID' : (isPatient ? 'PATIENT RECORD ID' : 'UNKNOWN')}`);
        }

        const records = await Record.find({});
        console.log(`Medical Records: ${records.length}`);
        for (const r of records) {
            const isUser = await User.exists({ _id: r.patientId });
            const isPatient = await Patient.exists({ _id: r.patientId });
            console.log(`Record "${r.diagnosis || r._id}": ${isUser ? 'USER ID' : (isPatient ? 'PATIENT RECORD ID' : 'UNKNOWN')}`);
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

inspect();
