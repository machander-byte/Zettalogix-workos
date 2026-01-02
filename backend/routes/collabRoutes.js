import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  listRoomMessages,
  postRoomMessage,
  listRoomFiles,
  postRoomFile
} from '../controllers/collabController.js';

const router = Router();
router.use(protect);

router.get('/messages', listRoomMessages);
router.post('/messages', postRoomMessage);
router.get('/files', listRoomFiles);
router.post('/files', postRoomFile);

export default router;
