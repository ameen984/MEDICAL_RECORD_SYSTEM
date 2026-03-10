import { Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import Patient from '../models/Patient';
import { AuthRequest } from '../middleware/auth';
import { createActivityLog } from './activityController';

// @desc    Get all medical records
// @route   GET /api/records
// @access  Private
export const getRecords = async (req: AuthRequest, res: Response) => {
    try {
        let query: any = {};

        // Patients can only see their own records
        if (req.user?.role === 'patient') {
            query.patientId = req.user._id;
        }

        // Filter by patientId if provided
        if (req.query.patientId) {
            query.patientId = req.query.patientId;
        }

        // Enforce sharing consent for doctors/admins querying a specific patient
        if ((req.user?.role === 'doctor' || req.user?.role === 'admin') && query.patientId) {
            const patientInfo = await Patient.findOne({ userId: query.patientId });
            if (patientInfo?.sharingPreference === 'explicit') {
                const activeContextId = req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0];
                const isApproved = patientInfo.approvedHospitals?.some(
                    (hid: any) => hid.toString() === activeContextId?.toString()
                );
                if (!isApproved) {
                    return res.status(403).json({
                        success: false,
                        message: 'This patient requires explicit consent to share records with your current facility.',
                    });
                }
            }
        }

        const records = await MedicalRecord.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
            .populate('hospitalId', 'name')
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

// @desc    Get single medical record
// @route   GET /api/records/:id
// @access  Private
export const getRecordById = async (req: AuthRequest, res: Response) => {
    try {
        const record = await MedicalRecord.findById(req.params.id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
            .populate('hospitalId', 'name');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found',
            });
        }

        // Check if patient is accessing their own record
        if (req.user?.role === 'patient' && record.patientId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this record',
            });
        }

        res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create medical record
// @route   POST /api/records
// @access  Private/Doctor
export const createRecord = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId, diagnosis, treatment, prescriptions, notes, nextFollowUp } = req.body;

        const record = await MedicalRecord.create({
            patientId,
            doctorId: req.user?._id,
            hospitalId: req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0],
            diagnosis,
            treatment,
            prescriptions,
            notes,
            nextFollowUp,
            date: new Date(),
        });

        const populatedRecord = await MedicalRecord.findById(record._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email');

        // Log record creation
        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Doctor',
            hospitalId: req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0],
            action: 'PROFILE_UPDATE',
            details: `Created medical record for patient: ${(populatedRecord?.patientId as any)?.name || 'Unknown'}`,
            targetUser: patientId,
        });

        res.status(201).json({
            success: true,
            data: populatedRecord,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update medical record
// @route   PUT /api/records/:id
// @access  Private/Doctor
export const updateRecord = async (req: AuthRequest, res: Response) => {
    try {
        const { diagnosis, treatment, prescriptions, notes, nextFollowUp } = req.body;

        // Fetch the record first to enforce ownership
        const existingRecord = await MedicalRecord.findById(req.params.id);

        if (!existingRecord) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found',
            });
        }

        // Doctors can only update records they created; admins and super_admins are unrestricted
        const role = req.user?.role;
        if (role === 'doctor' && existingRecord.doctorId.toString() !== req.user!._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update a record you did not create',
            });
        }

        const record = await MedicalRecord.findByIdAndUpdate(
            req.params.id,
            { diagnosis, treatment, prescriptions, notes, nextFollowUp },
            { new: true, runValidators: true }
        )
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found',
            });
        }

        // Log record update
        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Doctor',
            hospitalId: record.hospitalId || req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0],
            action: 'PROFILE_UPDATE',
            details: `Updated medical record for patient: ${(record.patientId as any)?.name || 'Unknown'}`,
            targetUser: (record.patientId as any)?._id || record.patientId,
        });

        res.status(200).json({
            success: true,
            data: record,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete medical record
// @route   DELETE /api/records/:id
// @access  Private/Doctor/Admin
export const deleteRecord = async (req: AuthRequest, res: Response) => {
    try {
        const record = await MedicalRecord.findById(req.params.id).populate('patientId', 'name');

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found',
            });
        }

        await record.deleteOne();

        // Log record deletion
        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Doctor',
            hospitalId: record.hospitalId || req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0],
            action: 'PROFILE_UPDATE',
            details: `Deleted medical record for patient: ${(record.patientId as any)?.name || 'Unknown'}`,
            targetUser: (record.patientId as any)?._id || record.patientId,
        });

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
