import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'feedbackflow_session';
export const SESSION_SECONDS = 24 * 60 * 60;

export function validateAuthConfig() {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes. Configure a strong random secret.');
  }
  let origin;
  try { origin = new URL(process.env.APP_ORIGIN); } catch { throw new Error('APP_ORIGIN must be an HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== process.env.APP_ORIGIN ||
      (process.env.NODE_ENV === 'production' && origin.protocol !== 'https:')) {
    throw new Error('APP_ORIGIN must be an exact origin without a path; production requires HTTPS.');
  }
}

export function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
}

export function establishSession(res, user) {
  validateAuthConfig();
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256', subject: user.id, expiresIn: SESSION_SECONDS,
    issuer: 'feedbackflow', audience: 'feedbackflow-web',
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_SECONDS * 1000 });
}

export function verifySession(token) {
  validateAuthConfig();
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ['HS256'], issuer: 'feedbackflow', audience: 'feedbackflow-web',
  });
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
