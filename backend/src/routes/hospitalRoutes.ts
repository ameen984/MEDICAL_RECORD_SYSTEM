import express from 'express';
import { getHospitals, createHospital, updateHospital, deleteHospital } from '../controllers/hospitalController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// Open read access for all authenticated users to power the dropdowns and configuration tools
router.route('/').get(getHospitals);

// Strict admin lockdown for creation, updates, and deletes
router.use(authorize('super_admin'));
router.route('/').post(createHospital);
router.route('/:id').put(updateHospital).delete(deleteHospital);

export default router;
