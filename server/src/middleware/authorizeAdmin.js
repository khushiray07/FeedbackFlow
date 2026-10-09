import { HttpError } from '../utils/HttpError.js';

export function authorizeAdmin(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'FORBIDDEN', 'Administrator access is required.'));
  next();
}
