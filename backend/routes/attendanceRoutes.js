import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  getMyAttendance,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  listAttendance,
  overrideAttendance
} from '../controllers/attendanceController.js';

const router = Router();
router.use(protect);

router.get('/me', getMyAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);
router.get('/', requireRole('admin', 'manager', 'hr'), listAttendance);
router.patch('/:id/override', requireRole('admin', 'hr'), overrideAttendance);

export default router;
