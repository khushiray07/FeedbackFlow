import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minLength: 2, maxLength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
}, {
  timestamps: true,
  toJSON: { transform(_document, value) { delete value.passwordHash; return value; } },
});

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
