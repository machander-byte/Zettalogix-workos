import { Router } from 'express';
import { heartbeat, goOffline, listPresence } from '../controllers/presenceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(protect);
router.post('/heartbeat', heartbeat);
router.post('/offline', goOffline);
router.get('/users', requireRole('admin', 'manager'), listPresence);

export default router;
