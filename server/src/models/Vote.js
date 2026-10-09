import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedback: { type: mongoose.Schema.Types.ObjectId, ref: 'Feedback', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

voteSchema.index({ user: 1, feedback: 1 }, { unique: true });
voteSchema.index({ feedback: 1 });

export default mongoose.model('Vote', voteSchema);
