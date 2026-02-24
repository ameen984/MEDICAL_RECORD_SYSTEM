import { Response } from 'express';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middleware/auth';

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

        const records = await MedicalRecord.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
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
            .populate('doctorId', 'name email');

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
        const { patientId, diagnosis, treatment, prescriptions, notes } = req.body;

        const record = await MedicalRecord.create({
            patientId,
            doctorId: req.user?._id,
            diagnosis,
            treatment,
            prescriptions,
            notes,
            date: new Date(),
        });

        const populatedRecord = await MedicalRecord.findById(record._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email');

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
        const { diagnosis, treatment, prescriptions, notes } = req.body;

        const record = await MedicalRecord.findByIdAndUpdate(
            req.params.id,
            { diagnosis, treatment, prescriptions, notes },
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
        const record = await MedicalRecord.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Medical record not found',
            });
        }

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
