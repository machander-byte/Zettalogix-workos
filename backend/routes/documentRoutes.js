import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { listDocuments, uploadDocument } from '../controllers/documentController.js';

const router = Router();
router.use(protect);

router.get('/', listDocuments);
router.post('/', requireRole('admin', 'manager', 'hr'), upload.single('file'), uploadDocument);

export default router;
