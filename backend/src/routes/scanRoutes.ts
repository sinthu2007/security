import { Router } from 'express';
import { ScanController } from '../controllers/scanController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { scanRateLimiter } from '../middleware/rateLimiter';
import { startScanSchema, compareScansSchema } from '../validators/scanValidator';

const router = Router();

router.use(authenticate);

router.post('/', scanRateLimiter, validateRequest(startScanSchema), ScanController.startScan);
router.get('/', ScanController.getUserScans);
router.get('/dashboard-stats', ScanController.getDashboardStats);
router.post('/compare', validateRequest(compareScansSchema), ScanController.compareScans);
router.get('/:id', ScanController.getScanById);
router.get('/:id/status', ScanController.getScanStatus);
router.get('/:id/findings', ScanController.getScanFindings);
router.delete('/:id', ScanController.deleteScan);

export default router;
