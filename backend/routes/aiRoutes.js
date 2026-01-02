import { Router } from 'express';
import { summarizeWork } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/summary', protect, summarizeWork);

export default router;
