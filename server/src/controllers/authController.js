import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { establishSession, clearSession, publicUser } from '../utils/session.js';

// Still perform a bcrypt comparison for unknown accounts.
const dummyHash = bcrypt.hash('unused-comparison-value', 12);

export async function register(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await User.create({ name, email, passwordHash, role: 'user' });
  } catch (error) {
    if (error.code === 11000) throw new HttpError(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    throw error;
  }
  establishSession(res, user);
  res.status(201).json({ user: publicUser(user) });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const matches = await bcrypt.compare(req.body.password, user?.passwordHash || await dummyHash);
  if (!user || !matches) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  establishSession(res, user);
  res.json({ user: publicUser(user) });
}

export function logout(_req, res) {
  clearSession(res);
  res.json({ message: 'Logged out.' });
}

export function currentUser(req, res) {
  res.json({ user: publicUser(req.user) });
}
