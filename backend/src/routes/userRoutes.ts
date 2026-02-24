import express from 'express';
import { getUsers, createUser, updateUserRole, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getUsers).post(createUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
