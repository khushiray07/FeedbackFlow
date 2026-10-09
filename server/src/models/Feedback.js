import mongoose from 'mongoose';
import { CATEGORIES, STATUSES } from './constants.js';

const feedbackSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minLength: 5, maxLength: 100 },
  description: { type: String, required: true, trim: true, minLength: 20, maxLength: 2000 },
  category: { type: String, required: true, enum: CATEGORIES },
  status: { type: String, required: true, enum: STATUSES, default: 'under_review' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
