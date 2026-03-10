import express from 'express';
import { getActivityLogs } from '../controllers/activityController';
import { protect, isAdminOrSuperAdmin, enforceHospitalScope } from '../middleware/auth';

const router = express.Router();

router.route('/')
    .get(protect, isAdminOrSuperAdmin, enforceHospitalScope, getActivityLogs);

export default router;
