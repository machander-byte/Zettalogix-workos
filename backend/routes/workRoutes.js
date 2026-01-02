import { Router } from 'express';
import {
  startWork,
  stopWork,
  recordActivePage,
  recordIdle,
  getCurrentSession,
  pauseWork,
  resumeWork,
  startWorkTimer,
  tickWorkTimer,
  endWorkTimer,
  getTodayWorkTotals
} from '../controllers/workController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/start', protect, startWork);
router.post('/stop', protect, stopWork);
router.post('/pause', protect, pauseWork);
router.post('/resume', protect, resumeWork);
router.post('/active-page', protect, recordActivePage);
router.post('/idle', protect, recordIdle);
router.get('/current', protect, getCurrentSession);
router.post('/session/start', protect, startWorkTimer);
router.post('/session/tick', protect, tickWorkTimer);
router.post('/session/end', protect, endWorkTimer);
router.get('/me/today', protect, getTodayWorkTotals);

export default router;
