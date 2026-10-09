import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import { HttpError } from '../utils/HttpError.js';
import { getFeedback, listFeedback } from '../services/feedbackService.js';
import { listFeedbackSchema } from '../validators/feedbackSchemas.js';

export async function createFeedback(req, res) {
  const feedback = await Feedback.create({ ...req.body, author: req.user._id, status: 'under_review' });
  res.status(201).json({ data: await getFeedback(String(feedback._id), req.user._id) });
}

export async function feedbackDetails(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'INVALID_ID', 'Invalid feedback ID.');
  const feedback = await getFeedback(req.params.id, req.user?._id);
  if (!feedback) throw new HttpError(404, 'NOT_FOUND', 'Feedback not found.');
  res.json({ data: feedback });
}

export async function feedbackList(req, res) {
  const parsed = listFeedbackSchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'VALIDATION_ERROR', 'Please check the query parameters.');
  res.json(await listFeedback(parsed.data, req.user?._id));
}
