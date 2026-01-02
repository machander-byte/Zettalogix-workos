import { Router } from 'express';
import {
  getOnlineEmployees,
  getProductivity,
  weeklyReport,
  monthlyReport,
  getAdminTasks,
  getAllLogs,
  getDashboardSnapshot,
  getActivityFeed
} from '../controllers/adminController.js';
import { exportData, importData } from '../controllers/dataController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole, requirePermission } from '../middleware/roleMiddleware.js';

const router = Router();
router.use(protect);
router.get('/dashboard', requireRole('admin'), getDashboardSnapshot);
router.get('/online', requireRole('admin', 'manager'), getOnlineEmployees);
router.get('/productivity', requireRole('admin', 'manager'), getProductivity);
router.get('/activity', requireRole('admin', 'auditor'), requirePermission('audit:view'), getActivityFeed);
router.get('/reports/weekly', requireRole('admin', 'hr'), requirePermission('reports:view'), weeklyReport);
router.get('/reports/monthly', requireRole('admin', 'hr'), requirePermission('reports:view'), monthlyReport);
router.get('/tasks', requireRole('admin', 'manager'), getAdminTasks);
router.get('/logs', requireRole('admin', 'hr', 'auditor'), getAllLogs);
router.get('/data/export', requireRole('admin'), exportData);
router.post('/data/import', requireRole('admin'), importData);

export default router;
