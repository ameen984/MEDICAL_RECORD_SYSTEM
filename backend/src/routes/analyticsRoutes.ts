import express from 'express';
import { getSystemStats, getAdmissionVolume, getFacilityActivity, getDiseaseDemographics } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Apply protection to all routes
router.use(protect);
router.use(authorize('admin', 'super_admin'));

router.get('/stats', getSystemStats);
router.get('/volume', getAdmissionVolume);
router.get('/activity', getFacilityActivity);
router.get('/demographics', getDiseaseDemographics);

export default router;
