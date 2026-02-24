import express from 'express';
import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord } from '../controllers/recordController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getRecords)
    .post(authorize('doctor'), createRecord);

router.route('/:id')
    .get(getRecordById)
    .put(authorize('doctor'), updateRecord)
    .delete(authorize('doctor', 'admin'), deleteRecord);

export default router;
