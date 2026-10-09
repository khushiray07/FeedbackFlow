import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';
import { STATUSES } from '../models/constants.js';
import { HttpError } from '../utils/HttpError.js';
import { getFeedback } from '../services/feedbackService.js';

export async function adminStats(_req, res) {
  const [counts, totalVotes] = await Promise.all([
    Feedback.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Vote.countDocuments(),
  ]);
  const byStatus = Object.fromEntries(STATUSES.map(status => [status, 0]));
  for (const row of counts) byStatus[row._id] = row.count;
  res.json({
    totalFeedback: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
    totalVotes,
    underReview: byStatus.under_review,
    planned: byStatus.planned,
    inProgress: byStatus.in_progress,
    completed: byStatus.completed,
  });
}

export async function updateFeedbackStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'INVALID_ID', 'Invalid feedback ID.');
  const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status: req.body.status }, { returnDocument: 'after' });
  if (!feedback) throw new HttpError(404, 'NOT_FOUND', 'Feedback not found.');
  res.json({ data: await getFeedback(String(feedback._id), req.user._id) });
}
