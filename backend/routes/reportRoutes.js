import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  dailyActivityReport,
  weeklySummaryReport,
  teamOverviewReport,
  idlePatternReport
} from '../controllers/reportController.js';

const router = Router();
router.get('/daily', protect, requireRole('admin', 'manager'), dailyActivityReport);
router.get('/weekly', protect, requireRole('admin', 'manager'), weeklySummaryReport);
router.get('/team', protect, requireRole('manager', 'admin'), teamOverviewReport);
router.get('/idle-pattern', protect, requireRole('admin', 'manager'), idlePatternReport);

export default router;
