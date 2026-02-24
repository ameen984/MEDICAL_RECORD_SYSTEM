import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import Report from '../models/Report';
import { AuthRequest } from '../middleware/auth';

// @desc    Get reports
// @route   GET /api/reports
// @access  Private
export const getReports = async (req: AuthRequest, res: Response) => {
    try {
        let query: any = {};

        // Patients can only see their own reports
        if (req.user?.role === 'patient') {
            query.patientId = req.user._id;
        }

        // Filter by patientId if provided
        if (req.query.patientId) {
            query.patientId = req.query.patientId;
        }

        // Filter by type if provided
        if (req.query.type) {
            query.type = req.query.type;
        }

        const reports = await Report.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
            .populate('uploadedBy', 'name email')
            .sort({ uploadDate: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Upload report
// @route   POST /api/reports/upload
// @access  Private/Doctor
export const uploadReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file',
            });
        }

        const { patientId, type, title, recordId } = req.body;

        // Determine upload details based on role
        let targetPatientId = patientId;
        let doctorId = undefined;

        if (req.user?.role === 'patient') {
            targetPatientId = req.user._id; // Patient uploads to themselves
        } else if (req.user?.role === 'doctor') {
            doctorId = req.user._id;
        }

        const report = await Report.create({
            patientId: targetPatientId,
            doctorId: doctorId,
            uploadedBy: req.user?._id,
            recordId: recordId || undefined,
            type,
            title,
            fileName: req.file.filename,
            filePath: req.file.path,
        });

        const populatedReport = await Report.findById(report._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
            .populate('uploadedBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedReport,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Download report
// @route   GET /api/reports/:id/download
// @access  Private
export const downloadReport = async (req: AuthRequest, res: Response) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found',
            });
        }

        // Check if patient is accessing their own report
        if (req.user?.role === 'patient' && report.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this report',
            });
        }

        // Check if file exists
        if (!fs.existsSync(report.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found',
            });
        }

        res.download(report.filePath, report.fileName);
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private/Doctor/Admin
export const deleteReport = async (req: AuthRequest, res: Response) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found',
            });
        }

        // Delete file from filesystem
        if (fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
        }

        await report.deleteOne();

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
