import { Router } from 'express';
import { roadmap } from '../controllers/roadmapController.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';

const router = Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', optionalAuthenticate, roadmap);
export default router;
