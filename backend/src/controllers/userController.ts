import { Response } from 'express';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import Report from '../models/Report';
import { AuthRequest } from '../middleware/auth';
import { createActivityLog } from './activityController';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/AdminOrSuperAdmin
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        let filter: any = {};

        if (req.user?.role === 'admin') {
            const adminHospitalIds = req.user.hospitalIds || [];

            // Find all patients who have records or reports connected to this hospital
            const [records, reports] = await Promise.all([
                MedicalRecord.find({ hospitalId: { $in: adminHospitalIds } }).select('patientId'),
                Report.find({ hospitalId: { $in: adminHospitalIds } }).select('patientId')
            ]);

            const patientIds = [
                ...records.map(r => r.patientId.toString()),
                ...reports.map(r => r.patientId.toString())
            ];
            const uniquePatientIds = [...new Set(patientIds)];

            filter = {
                $or: [
                    { hospitalIds: { $in: adminHospitalIds } }, // Staff explicitly assigned
                    { _id: { $in: uniquePatientIds }, role: 'patient' } // Dynamic patients
                ]
            };
        }

        const users = await User.find(filter)
            .select('-password')
            .populate('hospitalIds', 'name');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/AdminOrSuperAdmin
export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, role, phone, hospitalIds } = req.body;

        // Strict role validation
        if (req.user?.role === 'admin' && (role === 'admin' || role === 'super_admin')) {
            return res.status(403).json({ success: false, message: 'Facility Admins cannot create other admins.' });
        }

        let finalHospitalIds = hospitalIds;
        if (req.user?.role === 'admin') {
            const adminHosps = req.user.hospitalIds?.map(id => id.toString()) || [];
            if (hospitalIds) {
                const reqIds = Array.isArray(hospitalIds) ? hospitalIds : [hospitalIds];
                finalHospitalIds = reqIds.filter((id: string) => adminHosps.includes(id));
                if (finalHospitalIds.length === 0) finalHospitalIds = [adminHosps[0]];
            } else {
                finalHospitalIds = [adminHosps[0]];
            }
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            phone,
            hospitalIds: finalHospitalIds,
        });

        // If user is a patient, create patient profile
        if (user.role === 'patient') {
            await Patient.create({ userId: user._id });
        }

        res.status(201).json({
            success: true,
            data: user,
        });

        // Log admin user creation
        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Admin',
            hospitalId: req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0], // Bind log horizontally
            action: 'SIGNUP',
            details: `Admin created new ${user.role} account: ${user.email}`,
            targetUser: user._id,
            targetUserName: user.name
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update user details
// @route   PATCH /api/users/:id
// @access  Private/AdminOrSuperAdmin
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, role, phone, hospitalIds } = req.body;

        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Strict role boundaries for Admins
        if (req.user?.role === 'admin') {
            const adminHospitalIds = req.user.hospitalIds?.map(id => id.toString()) || [];

            // Check if patient is affiliated
            let isAffiliatedPatient = false;
            if (user.role === 'patient') {
                const hasRecord = await MedicalRecord.exists({ patientId: user._id, hospitalId: { $in: adminHospitalIds } });
                const hasReport = await Report.exists({ patientId: user._id, hospitalId: { $in: adminHospitalIds } });
                isAffiliatedPatient = !!hasRecord || !!hasReport;
            }

            const userHospIds = user.hospitalIds?.map(id => id.toString()) || [];
            const overlaps = userHospIds.some(id => adminHospitalIds.includes(id));

            if (!overlaps && !isAffiliatedPatient) {
                console.error(`[CTRL-403-F] Admin ${req.user?._id} cannot modify user ${user._id} (${user.email}). Admin hospitals: [${adminHospitalIds.join(', ')}]. User hospitals: [${userHospIds.join(', ')}]. isAffiliatedPatient: ${isAffiliatedPatient}`);
                return res.status(403).json({ success: false, message: 'You cannot modify users outside of your assigned facilities.' });
            }
            if ((role === 'admin' || role === 'super_admin') && user.role !== 'admin') {
                console.error(`[CTRL-403-G] Admin ${req.user?._id} tried to promote ${user._id} to role '${role}'.`);
                return res.status(403).json({ success: false, message: 'Facility Admins cannot promote users to admin.' });
            }
            if (hospitalIds) {
                const requestIds = Array.isArray(hospitalIds) ? hospitalIds : [hospitalIds];
                const validIds = requestIds.every((id: string) => adminHospitalIds.includes(id));
                if (!validIds) {
                    return res.status(403).json({ success: false, message: 'Facility Admins cannot transfer users to facilities they do not manage.' });
                }
            }
        }

        const oldRole = user.role;
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) {
            user.role = role;
            // If changing to patient, ensure profile exists
            if (role === 'patient') {
                const patientProfile = await Patient.findOne({ userId: user._id });
                if (!patientProfile) {
                    await Patient.create({ userId: user._id });
                }
            }
        }
        if (phone !== undefined) user.phone = phone;
        if (hospitalIds !== undefined) user.hospitalIds = Array.isArray(hospitalIds) ? hospitalIds : [hospitalIds];
        if (password) user.password = password; // Will be hashed by pre-save hook

        await user.save();

        // Log role change if it happened
        if (role && role !== oldRole) {
            await createActivityLog({
                user: req.user?._id,
                userName: req.user?.name || 'Admin',
                hospitalId: req.user?.hospitalIds?.[0] || null, // Bind log horizontally
                action: 'ROLE_CHANGE',
                details: `Changed role of ${user.name} from ${oldRole} to ${role}`,
                targetUser: user._id,
                targetUserName: user.name
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                createdAt: user.createdAt,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/AdminOrSuperAdmin
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (req.user?.role === 'admin') {
            const adminHospitalIds = req.user.hospitalIds?.map(id => id.toString()) || [];

            let isAffiliatedPatient = false;
            if (targetUser.role === 'patient') {
                const hasRecord = await MedicalRecord.exists({ patientId: targetUser._id, hospitalId: { $in: adminHospitalIds } });
                const hasReport = await Report.exists({ patientId: targetUser._id, hospitalId: { $in: adminHospitalIds } });
                isAffiliatedPatient = !!hasRecord || !!hasReport;
            }

            const targetHospIds = targetUser.hospitalIds?.map(id => id.toString()) || [];
            const overlaps = targetHospIds.some(id => adminHospitalIds.includes(id));

            if (!overlaps && !isAffiliatedPatient) {
                return res.status(403).json({ success: false, message: 'You cannot delete users outside of your assigned facilities.' });
            }
            if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
                return res.status(403).json({ success: false, message: 'Facility Admins cannot delete other admins.' });
            }
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (user) {
            // Also delete patient profile if exists
            await Patient.findOneAndDelete({ userId: user._id });

            // Log user deletion
            await createActivityLog({
                user: req.user?._id,
                userName: req.user?.name || 'Admin',
                hospitalId: req.user?.hospitalIds?.[0] || null, // Bind log horizontally
                action: 'USER_DELETE',
                details: `Deleted user account: ${user.name} (${user.email})`
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

// @desc    Toggle user active status (suspend/activate)
// @route   PATCH /api/users/:id/status
// @access  Private/AdminOrSuperAdmin
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { isActive } = req.body;

        // Ensure we don't accidentally suspend ourselves
        if (req.params.id === req.user?._id.toString() && isActive === false) {
            return res.status(400).json({
                success: false,
                message: 'Cannot suspend your own admin account',
            });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Enforce boundary: Standard Admins can only suspend staff in their own hospital
        if (req.user?.role === 'admin') {
            const adminHospitalIds = req.user.hospitalIds?.map(id => id.toString()) || [];

            let isAffiliatedPatient = false;
            if (targetUser.role === 'patient') {
                const hasRecord = await MedicalRecord.exists({ patientId: targetUser._id, hospitalId: { $in: adminHospitalIds } });
                const hasReport = await Report.exists({ patientId: targetUser._id, hospitalId: { $in: adminHospitalIds } });
                isAffiliatedPatient = !!hasRecord || !!hasReport;
            }

            const targetHospIds = targetUser.hospitalIds?.map(id => id.toString()) || [];
            const overlaps = targetHospIds.some(id => adminHospitalIds.includes(id));

            if (!overlaps && !isAffiliatedPatient) {
                return res.status(403).json({ success: false, message: 'You cannot modify users outside of your assigned facilities.' });
            }
            if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
                return res.status(403).json({ success: false, message: 'Facility Admins cannot suspend other admins.' });
            }
        }

        targetUser.isActive = isActive;
        const user = await targetUser.save();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'Admin',
            hospitalId: req.user?.hospitalIds?.[0] || null, // Bind log horizontally
            action: isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_SUSPENDED',
            details: `${isActive ? 'Restored' : 'Suspended'} access for ${user?.role || 'user'}: ${user?.email || 'unknown'}`,
            targetUser: user?._id,
            targetUserName: user?.name || 'Unknown'
        });

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
