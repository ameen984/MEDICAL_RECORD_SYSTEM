import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import Report from '../models/Report';
import Hospital from '../models/Hospital';
import ActivityLog from '../models/ActivityLog';

dotenv.config();

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Patient.deleteMany();
        await MedicalRecord.deleteMany();
        await Report.deleteMany();
        await Hospital.deleteMany();
        await ActivityLog.deleteMany();

        console.log('✅ Data cleared successfully...');

        // -------------------------
        // 1. Create Hospitals
        // -------------------------
        const h1 = await Hospital.create({
            name: "Central Metropolitan Hospital",
            address: "100 Prime Ave, New York, NY",
            contactEmail: "contact@centralmetro.com",
            contactPhone: "+1-212-555-0100"
        });

        const h2 = await Hospital.create({
            name: "Lakeside Regional Medical Center",
            address: "88 Water Way, Seattle, CA",
            contactEmail: "info@lakesideregional.com",
            contactPhone: "+1-310-555-0200"
        });

        console.log('✅ 2 Hospitals created...');

        // -------------------------
        // 2. Create Admins
        // -------------------------
        await User.create({
            name: 'Network Super Admin',
            email: 'system-admin@medicare.com',
            password: 'password123',
            role: 'super_admin'
        });

        const adminH1 = await User.create({
            name: 'Central Admin',
            email: 'admin-central@medicare.com',
            password: 'password123',
            role: 'admin',
            hospitalId: h1._id
        });

        const adminH2 = await User.create({
            name: 'Lakeside Admin',
            email: 'admin-lakeside@medicare.com',
            password: 'password123',
            role: 'admin',
            hospitalId: h2._id
        });

        console.log('✅ Admins created (1 Super, 2 Standard)...');

        // -------------------------
        // 3. Create Doctors (2 per hospital)
        // -------------------------
        // Hospital 1 Doctors
        const drH1A = await User.create({
            name: 'Dr. Gregory House',
            email: 'dr.house@centralmetro.com',
            password: 'password123',
            role: 'doctor',
            hospitalId: h1._id
        });
        const drH1B = await User.create({
            name: 'Dr. James Wilson',
            email: 'dr.wilson@centralmetro.com',
            password: 'password123',
            role: 'doctor',
            hospitalId: h1._id
        });

        // Hospital 2 Doctors
        const drH2A = await User.create({
            name: 'Dr. Meredith Grey',
            email: 'dr.grey@lakesideregional.com',
            password: 'password123',
            role: 'doctor',
            hospitalId: h2._id
        });
        const drH2B = await User.create({
            name: 'Dr. Derek Shepherd',
            email: 'dr.shepherd@lakesideregional.com',
            password: 'password123',
            role: 'doctor',
            hospitalId: h2._id
        });

        console.log('✅ 4 Doctors created (2 per hospital)...');

        // -------------------------
        // 4. Create Patients (4 per hospital)
        // -------------------------
        const patientsH1 = [];
        for (let i = 1; i <= 4; i++) {
            const tempUser = await User.create({
                name: `Central Patient ${i}`,
                email: `patient.central${i}@example.com`,
                password: 'password123',
                role: 'patient',
            });
            await Patient.create({ userId: tempUser._id });
            patientsH1.push(tempUser);
        }

        const patientsH2 = [];
        for (let i = 1; i <= 4; i++) {
            const tempUser = await User.create({
                name: `Lakeside Patient ${i}`,
                email: `patient.lakeside${i}@example.com`,
                password: 'password123',
                role: 'patient',
            });
            await Patient.create({ userId: tempUser._id });
            patientsH2.push(tempUser);
        }

        console.log('✅ 8 Patients created (4 aligned per hospital)...');

        // -------------------------
        // 5. Create Medical Records to officially bind them horizontally 
        // -------------------------

        // H1 records (Bindings)
        for (const pt of patientsH1) {
            await MedicalRecord.create({
                patientId: pt._id,
                doctorId: drH1A._id,
                hospitalId: h1._id,
                date: new Date(),
                diagnosis: 'General Checkup',
                treatment: 'Standard vitals drawn',
                notes: 'Patient reports feeling well.',
            });
        }

        // H2 records (Bindings)
        for (const pt of patientsH2) {
            await MedicalRecord.create({
                patientId: pt._id,
                doctorId: drH2A._id,
                hospitalId: h2._id,
                date: new Date(),
                diagnosis: 'General Checkup',
                treatment: 'Standard vitals drawn',
                notes: 'Patient reports feeling well.',
            });
        }

        console.log('✅ Medical Records generated to establish patient-hospital bonds...');


        // -------------------------
        // 6. Provide readout
        // -------------------------
        console.log('\n\n🚀 DATABASE SEEDED SUCCESSFULLY 🚀');
        console.log('\n=======================================');
        console.log('            SUPER ADMIN                ');
        console.log('=======================================');
        console.log('  Login: system-admin@medicare.com');
        console.log('  Pass:  password123');

        console.log('\n=======================================');
        console.log('            HOSPITAL 1                 ');
        console.log(`    ${h1.name}`);
        console.log('=======================================');
        console.log(`  Admin Login: admin-central@medicare.com`);
        console.log(`  Admin Pass:  password123`);
        console.log(`  Dr 1 Login:  dr.house@centralmetro.com`);
        console.log(`  Dr 2 Login:  dr.wilson@centralmetro.com`);
        console.log(`  Patients mapped: 4 (patient.central1@example.com)`);

        console.log('\n=======================================');
        console.log('            HOSPITAL 2                 ');
        console.log(`    ${h2.name}`);
        console.log('=======================================');
        console.log(`  Admin Login: admin-lakeside@medicare.com`);
        console.log(`  Admin Pass:  password123`);
        console.log(`  Dr 1 Login:  dr.grey@lakesideregional.com`);
        console.log(`  Dr 2 Login:  dr.shepherd@lakesideregional.com`);
        console.log(`  Patients mapped: 4 (patient.lakeside1@example.com)`);
        console.log('=======================================\n');

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
