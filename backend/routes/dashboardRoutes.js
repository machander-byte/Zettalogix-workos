import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getDashboardOverview } from '../controllers/dashboardController.js';

const router = Router();
router.use(protect);
router.get('/', getDashboardOverview);

export default router;
