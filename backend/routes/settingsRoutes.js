import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getActivitySettings,
  saveActivitySettings,
  getBrowserSettings,
  saveBrowserSettings
} from '../controllers/settingsController.js';

const router = Router();
router.get('/activity', protect, requireRole('admin', 'manager'), getActivitySettings);
router.patch('/activity', protect, requireRole('admin'), saveActivitySettings);
router.get('/browser', protect, getBrowserSettings);
router.put('/browser', protect, requireRole('admin'), saveBrowserSettings);

export default router;
