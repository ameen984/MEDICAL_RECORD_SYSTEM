import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import ActivityLog from '../models/ActivityLog';
import Hospital from '../models/Hospital';

// @desc    Get top-level system stats
// @route   GET /api/analytics/stats
// @access  Private/Admin
export const getSystemStats = async (req: AuthRequest, res: Response) => {
    try {
        let hospitalMatch = {};

        if (req.user?.role !== 'super_admin') {
            const contextId = req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0];
            hospitalMatch = { hospitalId: contextId };
        }

        // Parallel counts for efficiency
        const [patientsCount, doctorsCount, recordsCount, hospitalsCount] = await Promise.all([
            User.countDocuments({ role: 'patient' }),
            User.countDocuments({ role: 'doctor', ...hospitalMatch }),
            MedicalRecord.countDocuments(hospitalMatch),
            req.user?.role === 'super_admin' ? Hospital.countDocuments({ status: 'active' }) : Promise.resolve(1)
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalPatients: patientsCount,
                totalDoctors: doctorsCount,
                totalRecords: recordsCount,
                totalHospitals: hospitalsCount
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get admission/record volume over time
// @route   GET /api/analytics/volume
// @access  Private/Admin
export const getAdmissionVolume = async (req: AuthRequest, res: Response) => {
    try {
        let matchStage: any = {};

        if (req.user?.role !== 'super_admin') {
            const contextId = req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0];
            matchStage.hospitalId = contextId ? contextId : null;
        }

        // Aggregate records by month for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        matchStage.date = { $gte: sixMonthsAgo };

        const volumeData = await MedicalRecord.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format for Recharts
        const formattedData = volumeData.map((item: any) => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                name: date.toLocaleString('default', { month: 'short' }),
                admissions: item.count
            };
        });

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get activity by facility
// @route   GET /api/analytics/activity
// @access  Private/Admin
export const getFacilityActivity = async (req: AuthRequest, res: Response) => {
    try {
        let matchStage: any = {};

        if (req.user?.role !== 'super_admin') {
            const contextId = req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0];
            matchStage.hospitalId = contextId ? contextId : null;
        }

        const activityData = await ActivityLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$hospitalId",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "hospitals",
                    localField: "_id",
                    foreignField: "_id",
                    as: "hospital"
                }
            },
            { $unwind: { path: "$hospital", preserveNullAndEmptyArrays: true } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const formattedData = activityData.map((item: any) => ({
            name: item.hospital?.name || 'System / Unassigned',
            activity: item.count
        }));

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get patient demographics (e.g. chronic conditions)
// @route   GET /api/analytics/demographics
// @access  Private/Admin
export const getDiseaseDemographics = async (req: AuthRequest, res: Response) => {
    try {
        // We look at all patients since conditions are universal
        const demographics = await Patient.aggregate([
            { $unwind: "$chronicConditions" },
            {
                $group: {
                    _id: { $trim: { input: { $toLower: "$chronicConditions" } } },
                    value: { $sum: 1 }
                }
            },
            { $sort: { value: -1 } },
            { $limit: 5 }
        ]);

        const formattedData = demographics.map((item: any) => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.value
        }));

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
