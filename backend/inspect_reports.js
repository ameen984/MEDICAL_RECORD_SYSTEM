const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const reportSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    title: String
}, { strict: false });
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
}, { strict: false });

const Report = mongoose.model('Report', reportSchema);
const User = mongoose.model('User', userSchema);
const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-record-system');
        
        const michael = await User.findOne({ name: /Michael Brown/i });
        if (!michael) {
            console.log('Michael Brown user not found');
            return;
        }
        
        const pRec = await Patient.findOne({ userId: michael._id });
        
        console.log(`Michael Brown User ID: ${michael._id}`);
        console.log(`Michael Brown Patient Record ID: ${pRec?._id}`);
        
        const reportsForUser = await Report.find({ patientId: michael._id });
        console.log(`Reports found with User ID: ${reportsForUser.length}`);
        reportsForUser.forEach(r => console.log(` - ${r.title}`));
        
        if (pRec) {
            const reportsForPRec = await Report.find({ patientId: pRec._id });
            console.log(`Reports found with Patient Record ID: ${reportsForPRec.length}`);
            reportsForPRec.forEach(r => console.log(` - ${r.title}`));
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

inspect();
