import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Appointment from '../models/Appointment';
import mongoose from 'mongoose';
import User from '../models/User';

export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { doctorId, hospitalId, date, reason, notes } = req.body;

        let targetPatientId = req.user!._id;

        // Admins and Doctors can create appointments for patients
        if ((req.user!.role === 'admin' || req.user!.role === 'super_admin' || req.user!.role === 'doctor') && req.body.patientId) {
            targetPatientId = req.body.patientId;
        }

        const appointment = await Appointment.create({
            patientId: targetPatientId,
            doctorId,
            hospitalId,
            date,
            reason,
            notes,
            status: 'scheduled'
        });

        res.status(201).json({
            success: true,
            data: appointment
        });

    } catch (error) {
        next(error);
    }
}

// @desc    Get appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let query: any = {};
        if (req.user!.role === 'patient') {
            query.patientId = req.user!._id;
        } else if (req.user!.role === 'doctor') {
            query.doctorId = req.user!._id;
        }

        const appointments = await Appointment.find(query).populate('doctorId', 'name email').populate('patientId', 'name email');

        res.status(200).json({ success: true, data: appointments });
    } catch (err) {
        next(err);
    }
}

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id
// @access  Private
export const updateAppointmentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

        if (req.body.status) {
            appointment.status = req.body.status;
        }

        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        next(err);
    }
}
