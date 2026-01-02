import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { listAnnouncements, createAnnouncement } from '../controllers/announcementController.js';

const router = Router();
router.use(protect);

router.get('/', listAnnouncements);
router.post('/', requireRole('admin', 'manager', 'hr'), createAnnouncement);

export default router;
