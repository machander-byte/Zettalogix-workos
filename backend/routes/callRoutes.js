import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  listCalls,
  createCall,
  startCall,
  endCall,
  listCallChat,
  postCallChat,
  listMyCallLogs,
  listTeamCallLogs
} from '../controllers/callController.js';

const router = Router();
router.use(protect);

router.get('/me', listMyCallLogs);
router.get('/team', requireRole('admin', 'manager'), listTeamCallLogs);
router.get('/', listCalls);
router.post('/', createCall);
router.post('/:id/start', startCall);
router.post('/:id/end', endCall);
router.get('/:id/chat', listCallChat);
router.post('/:id/chat', postCallChat);

export default router;
