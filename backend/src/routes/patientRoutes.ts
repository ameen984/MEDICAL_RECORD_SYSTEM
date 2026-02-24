import express from 'express';
import { getPatients, getPatientById, getPatientHistory, updatePatient } from '../controllers/patientController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', authorize('doctor', 'admin'), getPatients);
router.get('/:id', getPatientById);
router.get('/:id/history', getPatientHistory);
router.put('/:id', updatePatient);

export default router;
