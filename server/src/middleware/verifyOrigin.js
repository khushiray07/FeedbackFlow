import { HttpError } from '../utils/HttpError.js';
import { validateAuthConfig } from '../utils/session.js';

export function verifyOrigin(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  validateAuthConfig();
  // Strict in development too, so local testing exercises the production rule.
  if (req.get('Origin') !== process.env.APP_ORIGIN) {
    return next(new HttpError(403, 'FORBIDDEN_ORIGIN', 'Request origin is not allowed.'));
  }
  next();
}
