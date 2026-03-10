import { Response } from 'express';
import User from '../models/User';
import Patient from '../models/Patient';
import MedicalRecord from '../models/MedicalRecord';
import { AuthRequest } from '../middleware/auth';
import { createActivityLog } from './activityController';
import { notifyRole } from '../services/notificationService';
import PDFDocument from 'pdfkit';

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
        // Patients can only view their own history
        if (req.user?.role === 'patient' && req.params.id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this patient history',
            });
        }

        const patientInfo = await Patient.findOne({ userId: req.params.id });

        // Enforce sharing preference restrictions if the viewer is a doctor or admin (not the patient themselves and not super_admin)
        if (req.user?.role !== 'super_admin' && req.user?.role !== 'patient' && patientInfo?.sharingPreference === 'explicit') {
            const activeContextId = req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0];
            const isApproved = patientInfo.approvedHospitals?.some(hid => idMatch(hid, activeContextId));

            if (!isApproved) {
                // Log unauthorized access attempt
                await createActivityLog({
                    user: req.user?._id,
                    userName: req.user?.name || 'User',
                    hospitalId: activeContextId,
                    action: 'SECURITY_ALERT',
                    details: `Unauthorized attempt to access explicit-consent medical history mapping for patient ${req.params.id}`,
                    targetUser: req.params.id,
                });

                await notifyRole('super_admin', 'security',
                    `SECURITY ALERT: ${req.user?.name} attempted unauthorized access on patient ${req.params.id}`
                );

                return res.status(403).json({
                    success: false,
                    message: 'This patient requires explicit consent to share records with your current facility.',
                });
            }
        }

        const records = await MedicalRecord.find({ patientId: req.params.id })
            .populate('doctorId', 'name email')
            .populate('patientId', 'name email')
            .sort({ date: -1 });

        // Helper to match IDs
        function idMatch(id1: any, id2: any) {
            if (!id1 || !id2) return false;
            return id1.toString() === id2.toString();
        }

        // Log the 'READ' action
        let patientRef = await User.findById(req.params.id).select('name');
        await createActivityLog({
            user: req.user?._id,
            userName: req.user?.name || 'User',
            hospitalId: req.headers['x-hospital-context'] || req.user?.hospitalIds?.[0],
            action: 'RECORD_ACCESS',
            details: `Viewed medical history mapping for patient ${patientRef?.name || req.params.id}`,
            targetUser: req.params.id,
        });

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
        const { name, phone, dateOfBirth, bloodType, allergies, address, emergencyContact, emergencyPhone, height, weight, habits, chronicConditions, sharingPreference, approvedHospitals } = req.body;

        // Security Check: Ensure patient can only update their own profile
        if (req.user?.role === 'patient' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile',
            });
        }

        // Security Check: Only the patient themselves can change their own consent/sharing settings
        const isOwnProfile = req.user?._id.toString() === req.params.id;
        if (!isOwnProfile && (sharingPreference !== undefined || approvedHospitals !== undefined)) {
            return res.status(403).json({
                success: false,
                message: 'Only the patient can change their own sharing consent settings',
            });
        }

        // Prepare user update data, mapping empty strings to undefined to respect sparse unique indexes
        const userUpdateData: any = { name };
        if (phone) {
            userUpdateData.phone = phone;
        } else if (phone === '') {
            userUpdateData.phone = undefined;
        }

        // Update user (Contact info)
        const user = await User.findByIdAndUpdate(
            req.params.id,
            userUpdateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Update patient info (Medical/Emergency info and Consent params)
        const patientInfo = await Patient.findOneAndUpdate(
            { userId: user._id },
            { dateOfBirth, bloodType, allergies, address, emergencyContact, emergencyPhone, height, weight, habits, chronicConditions, sharingPreference, approvedHospitals },
            { new: true, runValidators: true, upsert: true }
        );

        // Only broadcast when consent-related fields actually changed
        // NOTE: This is a global broadcast to all connected doctors — intentional by design
        if (sharingPreference || approvedHospitals) {
            await notifyRole('doctor', 'consent',
                `Patient ${user.name} updated their sharing preferences.`,
                { patientId: user._id }
            );
        }

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

// @desc    Export patient history as PDF
// @route   GET /api/patients/:id/export
// @access  Private (Doctor/Admin)
export const exportPatientHistory = async (req: AuthRequest, res: Response) => {
    try {
        // Patients can only export their own history
        if (req.user?.role === 'patient' && req.params.id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to export this patient history',
            });
        }

        const patient: any = await Patient.findOne({ userId: req.params.id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        // Log this export operation for HIPAA auditing
        await createActivityLog({
            user: req.user?.id as any,
            userName: req.user?.name as string,
            action: 'RECORD_ACCESS',
            details: `Exported PDF history for patient: ${patient.name}`,
            targetUser: patient.id as any,
            targetUserName: patient.name,
            hospitalId: req.user?.hospitalIds?.[0] as any // best-effort linking
        });

        // Fetch records
        const records = await MedicalRecord.find({ patientId: patient.id }).sort('-date');

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Pipe to response
        res.setHeader('Content-disposition', `attachment; filename=patient_${patient.id}_history.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Medical History Export', { align: 'center' });
        doc.moveDown();

        // Patient Details
        doc.fontSize(14).text(`Patient Name: ${patient.name}`);
        if (patient.email) doc.fontSize(12).text(`Email: ${patient.email}`);
        if (patient.phone) doc.fontSize(12).text(`Phone: ${patient.phone}`);
        doc.moveDown();

        // Records
        doc.fontSize(16).text('Clinical Records:', { underline: true });
        doc.moveDown();

        if (records.length === 0) {
            doc.fontSize(12).text('No records found for this patient.');
        } else {
            records.forEach((record: any) => {
                doc.fontSize(12).text(`Date: ${new Date(record.date).toLocaleDateString()}`);
                doc.text(`Doctor: ${record.doctorName || 'Unknown'}`);
                doc.text(`Diagnosis: ${record.diagnosis}`);
                doc.text(`Treatment: ${record.treatment}`);
                if (record.prescriptions && record.prescriptions.length > 0) {
                    doc.text('Prescriptions:');
                    record.prescriptions.forEach((p: any) => {
                        doc.text(`  - ${p.medicationName}: ${p.dosage}, ${p.frequency} for ${p.duration}`);
                    });
                }
                if (record.notes) doc.text(`Notes: ${record.notes}`);
                doc.moveDown();
            });
        }

        doc.end();

    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
