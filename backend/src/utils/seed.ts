import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import Report from '../models/Report';

dotenv.config();

const seedDatabase = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Patient.deleteMany();
        await MedicalRecord.deleteMany();
        await Report.deleteMany();

        console.log('Data cleared...');

        // Create Admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            phone: '+1234567890',
        });

        // Create Doctors
        const doctor1 = await User.create({
            name: 'Dr. John Smith',
            email: 'doctor@example.com',
            password: 'doctor123',
            role: 'doctor',
            phone: '+1234567891',
        });

        const doctor2 = await User.create({
            name: 'Dr. Sarah Johnson',
            email: 'sarah@medicare.com',
            password: 'doctor123',
            role: 'doctor',
            phone: '+1234567892',
        });

        // Create Patients
        const patient1User = await User.create({
            name: 'Michael Brown',
            email: 'patient@example.com',
            password: 'patient123',
            role: 'patient',
            phone: '+1234567893',
        });

        const patient2User = await User.create({
            name: 'Emily Davis',
            email: 'emily@example.com',
            password: 'patient123',
            role: 'patient',
            phone: '+1234567894',
        });

        const patient3User = await User.create({
            name: 'James Wilson',
            email: 'james@example.com',
            password: 'patient123',
            role: 'patient',
            phone: '+1234567897',
        });

        // Create Patient Profiles
        await Patient.create({
            userId: patient1User._id,
            dateOfBirth: new Date('1985-05-15'),
            bloodType: 'A+',
            allergies: 'Penicillin',
            address: '123 Main St, New York, NY',
            emergencyContact: 'Jane Brown',
            emergencyPhone: '+1234567895',
        });

        await Patient.create({
            userId: patient2User._id,
            dateOfBirth: new Date('1990-08-22'),
            bloodType: 'O-',
            allergies: 'None',
            address: '456 Oak Ave, Los Angeles, CA',
            emergencyContact: 'Robert Davis',
            emergencyPhone: '+1234567896',
        });

        await Patient.create({
            userId: patient3User._id,
            dateOfBirth: new Date('1978-12-10'),
            bloodType: 'B+',
            allergies: 'Latex',
            address: '789 Pine Rd, Chicago, IL',
            emergencyContact: 'Lisa Wilson',
            emergencyPhone: '+1234567898',
        });

        // Create Medical Records
        await MedicalRecord.create({
            patientId: patient1User._id,
            doctorId: doctor1._id,
            date: new Date('2024-01-10'),
            diagnosis: 'Common Cold',
            treatment: 'Rest and hydration',
            prescriptions: 'Paracetamol 500mg',
            notes: 'Patient advised to return if symptoms worsen',
        });

        await MedicalRecord.create({
            patientId: patient1User._id,
            doctorId: doctor2._id,
            date: new Date('2024-01-15'),
            diagnosis: 'Hypertension',
            treatment: 'Lifestyle changes and medication',
            prescriptions: 'Lisinopril 10mg daily',
            notes: 'Monitor blood pressure weekly',
        });

        await MedicalRecord.create({
            patientId: patient2User._id,
            doctorId: doctor1._id,
            date: new Date('2024-01-12'),
            diagnosis: 'Migraine',
            treatment: 'Pain management',
            prescriptions: 'Sumatriptan 50mg as needed',
            notes: 'Avoid trigger foods',
        });

        console.log('Database seeded successfully!');
        console.log('\n========== LOGIN CREDENTIALS ==========');
        console.log('Admin:');
        console.log('  Email: admin@medicare.com');
        console.log('  Password: admin123');
        console.log('\nDoctor 1:');
        console.log('  Email: john@medicare.com');
        console.log('  Password: doctor123');
        console.log('\nDoctor 2:');
        console.log('  Email: sarah@medicare.com');
        console.log('  Password: doctor123');
        console.log('\nPatient 1:');
        console.log('  Email: michael@example.com');
        console.log('  Password: patient123');
        console.log('\nPatient 2:');
        console.log('  Email: emily@example.com');
        console.log('  Password: patient123');
        console.log('=======================================\n');

        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
