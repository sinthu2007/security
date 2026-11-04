import { Router } from 'express';
import { WebsiteController } from '../controllers/websiteController';
import { authenticate } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateMiddleware';
import { registerWebsiteSchema, verifyWebsiteSchema } from '../validators/websiteValidator';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(registerWebsiteSchema), WebsiteController.registerWebsite);
router.get('/', WebsiteController.getWebsites);
router.post('/:id/verify', validateRequest(verifyWebsiteSchema), WebsiteController.verifyWebsite);
router.delete('/:id', WebsiteController.deleteWebsite);

export default router;
