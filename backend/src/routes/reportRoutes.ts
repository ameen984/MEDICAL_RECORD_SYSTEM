import express from 'express';
import { getReports, uploadReport, downloadReport, deleteReport } from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../config/multer';

const router = express.Router();

router.use(protect);

router.get('/', getReports);
router.post('/upload', authorize('doctor', 'patient'), upload.single('file'), uploadReport);
router.get('/:id/download', downloadReport);
router.delete('/:id', authorize('doctor', 'admin'), deleteReport);

export default router;
