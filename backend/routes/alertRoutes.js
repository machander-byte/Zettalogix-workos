import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { listAlerts } from '../controllers/alertController.js';

const router = Router();
router.get('/', protect, requireRole('admin', 'manager'), listAlerts);

export default router;
