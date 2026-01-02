import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  listThreads,
  createDirectThread,
  getThread,
  getThreadMessages,
  postThreadMessage
} from '../controllers/chatController.js';

const router = Router();
router.use(protect);

router.get('/', listThreads);
router.post('/', createDirectThread);
router.get('/:id', getThread);
router.get('/:id/messages', getThreadMessages);
router.post('/:id/messages', postThreadMessage);

export default router;
