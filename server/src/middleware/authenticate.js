import { optionalAuthenticate } from './optionalAuthenticate.js';
import { HttpError } from '../utils/HttpError.js';

export async function authenticate(req, res, next) {
  await optionalAuthenticate(req, res, () => {});
  if (!req.user) return next(new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.'));
  next();
}
