import express from 'express';
import { getPatients, getPatientById, getPatientHistory, updatePatient, exportPatientHistory } from '../controllers/patientController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', authorize('doctor', 'admin'), getPatients);
router.get('/:id', getPatientById);
router.get('/:id/history', getPatientHistory);
router.get('/:id/export', authorize('doctor', 'admin', 'super_admin'), exportPatientHistory);
router.put('/:id', updatePatient);

export default router;
