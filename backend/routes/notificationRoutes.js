import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/roleMiddleware.js';
import {
  getMyNotifications,
  markNotificationRead,
  listRules,
  createRule,
  updateRule,
  deleteRule
} from '../controllers/notificationController.js';

const router = Router();
router.use(protect);

router.get('/', getMyNotifications);

router.get('/rules/list', requirePermission('notifications:manage'), listRules);
router.post('/rules', requirePermission('notifications:manage'), createRule);
router.put('/rules/:id', requirePermission('notifications:manage'), updateRule);
router.delete('/rules/:id', requirePermission('notifications:manage'), deleteRule);

router.post('/:id/read', markNotificationRead);

export default router;
