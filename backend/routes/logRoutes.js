import { Router } from 'express';
import { createDailyLog, getLogsForUser } from '../controllers/logController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/', protect, createDailyLog);
router.get('/user/:id', protect, getLogsForUser);

export default router;
