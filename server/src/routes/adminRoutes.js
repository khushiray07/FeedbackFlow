import { Router } from 'express';
import { adminStats } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorizeAdmin.js';

const router = Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/stats', authenticate, authorizeAdmin, adminStats);
export default router;
