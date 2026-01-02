import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  listProjects,
  createProject,
  updateProject,
  getProject,
  getProjectTasks
} from '../controllers/projectController.js';

const router = Router();
router.use(protect);

router.get('/', listProjects);
router.post('/', requireRole('admin', 'manager'), createProject);
router.get('/:id', getProject);
router.patch('/:id', requireRole('admin', 'manager'), updateProject);
router.get('/:id/tasks', getProjectTasks);

export default router;
