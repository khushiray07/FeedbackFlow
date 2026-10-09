import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { SESSION_COOKIE, verifySession } from '../utils/session.js';

export async function optionalAuthenticate(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  let claims;
  try {
    claims = verifySession(token);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError || error instanceof jwt.NotBeforeError) return next();
    throw error;
  }
  if (typeof claims.sub !== 'string' || !/^[a-f\d]{24}$/i.test(claims.sub)) return next();
  // Permissions always come from the current database record, never JWT roles.
  req.user = await User.findById(claims.sub);
  next();
}
