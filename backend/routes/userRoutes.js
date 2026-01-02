import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole, requirePermission } from '../middleware/roleMiddleware.js';
import {
  listEmployees,
  listRoster,
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
  getEmployeeProfile
} from '../controllers/userController.js';

const router = Router();

router.use(protect);
router.get('/', requireRole('admin', 'manager', 'hr'), listEmployees);
router.get('/roster', listRoster);
router.post('/', requirePermission('users:manage'), createEmployee);
router.get('/:id', requireRole('admin', 'manager', 'hr', 'auditor'), getEmployeeProfile);
router.patch('/:id', requirePermission('users:manage'), updateEmployee);
router.patch('/:id/status', requirePermission('users:manage'), setEmployeeStatus);

export default router;
