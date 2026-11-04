import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/:scanId', ReportController.generateReport);
router.get('/', ReportController.getUserReports);
router.get('/:id/download', ReportController.downloadReport);

export default router;
