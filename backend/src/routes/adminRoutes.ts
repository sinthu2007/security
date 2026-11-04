import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/adminMiddleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', AdminController.getAdminDashboard);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.toggleUserStatus);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.get('/scans', AdminController.getSystemScans);

export default router;
