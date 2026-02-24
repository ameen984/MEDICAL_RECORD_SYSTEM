import { Response } from 'express';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Doctor/Admin
export const getPatients = async (req: AuthRequest, res: Response) => {
    try {
        const patients = await User.find({ role: 'patient' }).select('-password');

        // Populate with patient details
        const patientsWithDetails = await Promise.all(
            patients.map(async (user) => {
                const patientInfo = await Patient.findOne({ userId: user._id });
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    ...patientInfo?.toObject(),
                    createdAt: user.createdAt,
                };
            })
        );

        res.status(200).json({
            success: true,
            count: patientsWithDetails.length,
            data: patientsWithDetails,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private/Doctor/Admin/Patient(own)
export const getPatientById = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user || user.role !== 'patient') {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        const patientInfo = await Patient.findOne({ userId: user._id });

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                ...patientInfo?.toObject(),
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get patient medical history
// @route   GET /api/patients/:id/history
// @access  Private/Doctor/Admin/Patient(own)
export const getPatientHistory = async (req: AuthRequest, res: Response) => {
    try {
        const records = await MedicalRecord.find({ patientId: req.params.id })
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: records.length,
            data: records,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update patient information
// @route   PUT /api/patients/:id
// @access  Private/Patient(own)/Admin
export const updatePatient = async (req: AuthRequest, res: Response) => {
    try {
        const { name, phone, dateOfBirth, bloodType, allergies, address, emergencyContact, emergencyPhone, height, weight, habits, chronicConditions } = req.body;

        // Security Check: Ensure patient can only update their own profile
        if (req.user?.role === 'patient' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile',
            });
        }

        // Update user (Contact info)
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, phone },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Update patient info (Medical/Emergency info)
        const patientInfo = await Patient.findOneAndUpdate(
            { userId: user._id },
            { dateOfBirth, bloodType, allergies, address, emergencyContact, emergencyPhone, height, weight, habits, chronicConditions },
            { new: true, runValidators: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: {
                ...patientInfo!.toObject(),
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
