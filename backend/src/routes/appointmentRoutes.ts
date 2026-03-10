import express from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from '../controllers/appointmentController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Apply auth middleware to all appointment routes
router.use(protect);

router.post('/', createAppointment);
router.get('/', getAppointments);
router.patch('/:id', updateAppointmentStatus);

export default router;
