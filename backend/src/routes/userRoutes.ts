import express from 'express';
import { getUsers, createUser, updateUserRole, updateUser, deleteUser, toggleUserStatus } from '../controllers/userController';
import { protect, isAdminOrSuperAdmin, enforceHospitalScope } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(isAdminOrSuperAdmin);
router.use(enforceHospitalScope);

router.route('/').get(getUsers).post(createUser);
router.put('/:id/role', updateUserRole);
router.patch('/:id/status', toggleUserStatus);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
