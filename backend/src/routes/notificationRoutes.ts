import express from 'express';
import { getNotifications, markOneRead, markAllRead } from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markOneRead);

export default router;
