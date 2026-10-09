import { Router } from 'express';
import { createFeedback, feedbackDetails, feedbackList } from '../controllers/feedbackController.js';
import { updateFeedbackStatus } from '../controllers/adminController.js';
import { authorizeAdmin } from '../middleware/authorizeAdmin.js';
import { addVote, removeVote } from '../controllers/voteController.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';
import { validate } from '../middleware/validate.js';
import { createFeedbackSchema, updateStatusSchema } from '../validators/feedbackSchemas.js';

const router = Router();
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/', optionalAuthenticate, feedbackList);
router.get('/:id', optionalAuthenticate, feedbackDetails);
router.post('/', authenticate, validate(createFeedbackSchema), createFeedback);
router.put('/:id/vote', authenticate, addVote);
router.delete('/:id/vote', authenticate, removeVote);
router.patch('/:id/status', authenticate, authorizeAdmin, validate(updateStatusSchema), updateFeedbackStatus);
export default router;
