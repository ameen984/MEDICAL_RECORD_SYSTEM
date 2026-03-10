import { Response } from 'express';
import Hospital from '../models/Hospital';
import { AuthRequest } from '../middleware/auth';
import { createActivityLog } from './activityController';

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private/Admin
export const getHospitals = async (req: AuthRequest, res: Response) => {
    try {
        let query: any = {};

        // Admins only see hospitals they are assigned to; super_admins see all
        if (req.user?.role === 'admin') {
            query._id = { $in: req.user.hospitalIds || [] };
        }

        const hospitals = await Hospital.find(query).sort('-createdAt');
        res.status(200).json({ success: true, count: hospitals.length, data: hospitals });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new hospital
// @route   POST /api/hospitals
// @access  Private/Admin
export const createHospital = async (req: AuthRequest, res: Response) => {
    try {
        const hospital = await Hospital.create(req.body);

        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Admin',
            action: 'CREATED_HOSPITAL',
            details: `Registered new facility: ${hospital.name}`
        });

        res.status(201).json({ success: true, data: hospital });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private/Admin
export const updateHospital = async (req: AuthRequest, res: Response) => {
    try {
        let hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Admin',
            action: 'UPDATED_HOSPITAL',
            details: `Updated facility details for: ${hospital?.name}`
        });

        res.status(200).json({ success: true, data: hospital });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Admin
export const deleteHospital = async (req: AuthRequest, res: Response) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        await hospital.deleteOne();

        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Admin',
            action: 'DELETED_HOSPITAL',
            details: `Removed facility from network: ${hospital.name}`
        });

        res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
