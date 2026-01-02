import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { getMyStatus, listEmployeeStatuses } from '../controllers/statusController.js';

const router = Router();
router.get('/me', protect, getMyStatus);
router.get('/employees', protect, requireRole('admin', 'manager'), listEmployeeStatuses);

export default router;
