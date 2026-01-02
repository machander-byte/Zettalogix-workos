import { Router } from 'express';
import {
  createTask,
  getTasksForUser,
  getTaskById,
  updateTask,
  addTaskComment,
  addTaskAttachment
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();
router.post('/', protect, requireRole('admin', 'manager', 'hr'), createTask);
router.get('/user/:id', protect, getTasksForUser);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.post('/:id/comment', protect, addTaskComment);
router.post('/:id/attachments', protect, upload.array('files', 5), addTaskAttachment);

export default router;
