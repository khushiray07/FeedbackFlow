import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';
import { HttpError } from '../utils/HttpError.js';

async function checkedFeedbackId(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, 'INVALID_ID', 'Invalid feedback ID.');
  const exists = await Feedback.exists({ _id: id });
  if (!exists) throw new HttpError(404, 'NOT_FOUND', 'Feedback not found.');
  return exists._id;
}

export async function addVote(req, res) {
  const feedback = await checkedFeedbackId(req.params.id);
  try {
    await Vote.updateOne(
      { user: req.user._id, feedback },
      { $setOnInsert: { user: req.user._id, feedback } },
      { upsert: true },
    );
  } catch (error) {
    // A concurrent upsert can lose the unique-index race; the desired vote now exists.
    if (error.code !== 11000 || !await Vote.exists({ user: req.user._id, feedback })) throw error;
  }
  res.json({ hasVoted: true, voteCount: await Vote.countDocuments({ feedback }) });
}

export async function removeVote(req, res) {
  const feedback = await checkedFeedbackId(req.params.id);
  await Vote.deleteOne({ user: req.user._id, feedback });
  res.json({ hasVoted: false, voteCount: await Vote.countDocuments({ feedback }) });
}
