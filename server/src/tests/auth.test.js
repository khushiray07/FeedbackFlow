import { randomUUID } from 'node:crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { it, expect, afterEach, vi } from 'vitest';
import app from '../app.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';
import { authorizeAdmin } from '../middleware/authorizeAdmin.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { SESSION_COOKIE, SESSION_SECONDS, validateAuthConfig } from '../utils/session.js';

const origin = 'http://localhost:5173';
const registration = () => ({ name: 'Demo User', email: `${randomUUID()}@example.test`, password: 'Valid-password-42' });
const post = path => request(app).post(`/api/auth/${path}`).set('Origin', origin);
const cookie = response => response.headers['set-cookie'][0].split(';')[0];
const tokenCookie = (subject, options = {}, payload = {}) => `${SESSION_COOKIE}=${jwt.sign(payload, process.env.JWT_SECRET, {
  algorithm: 'HS256', subject, issuer: 'feedbackflow', audience: 'feedbackflow-web', expiresIn: '1h', ...options,
})}`;

// These endpoints exist only in this test harness, not in the application.
const boundaries = express();
boundaries.use(cookieParser());
boundaries.get('/protected', authenticate, (req, res) => res.json({ id: req.user.id }));
boundaries.get('/admin', authenticate, authorizeAdmin, (_req, res) => res.json({ ok: true }));
boundaries.get('/public', optionalAuthenticate, (req, res) => res.json({ id: req.user?.id || null }));
boundaries.use(errorHandler);
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

it('registers, hashes the password, establishes a session and returns only safe user fields', async () => {
  const data = registration();
  const agent = request.agent(app);
  const result = await agent.post('/api/auth/register').set('Origin', origin).send(data).expect(201);
  expect(Object.keys(result.body.user).sort()).toEqual(['email', 'id', 'name', 'role']);
  expect(result.body.user.role).toBe('user');
  const user = await User.findById(result.body.user.id).select('+passwordHash');
  expect(user.passwordHash).not.toBe(data.password);
  expect(await bcrypt.compare(data.password, user.passwordHash)).toBe(true);
  const header = result.headers['set-cookie'][0];
  expect(header).toContain('HttpOnly');
  expect(header).toContain('SameSite=Lax');
  expect(header).toContain('Path=/');
  expect(header).toContain(`Max-Age=${SESSION_SECONDS}`);
  expect(header).not.toContain('Secure');
  const claims = jwt.decode(cookie(result).split('=')[1]);
  expect(claims.exp - claims.iat).toBe(SESSION_SECONDS);
  expect(claims).not.toHaveProperty('role');
  const me = await agent.get('/api/auth/me').expect(200);
  expect(me.body).toEqual(result.body);
  expect(me.headers['cache-control']).toBe('no-store');
});

it('normalizes email and rejects duplicate registrations, including concurrent requests', async () => {
  const data = registration();
  const results = await Promise.all([
    post('register').send(data), post('register').send({ ...data, email: ` ${data.email.toUpperCase()} ` }),
  ]);
  expect(results.map(r => r.status).sort()).toEqual([201, 409]);
  expect(await User.countDocuments({ email: data.email })).toBe(1);
});

it.each([
  { name: 'a' }, { name: 'a'.repeat(81) }, { email: 'not-an-email' },
  { password: 'short1' }, { password: 'has-no-number' },
  { password: `1${'é'.repeat(36)}` }, { password: '1'.repeat(73) },
  { role: 'admin' }, { passwordHash: 'injected' }, { unexpected: true },
])('rejects invalid or injected registration input %j without creating a user', async override => {
  const data = { ...registration(), ...override };
  const response = await post('register').send(data).expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
  expect(response.headers['set-cookie']).toBeUndefined();
  expect(await User.countDocuments({ email: data.email })).toBe(0);
});

it('logs in with normalized email and clears the cookie on repeated logout', async () => {
  const data = registration();
  await post('register').send(data).expect(201);
  const agent = request.agent(app);
  const loggedIn = await agent.post('/api/auth/login').set('Origin', origin)
    .send({ email: data.email.toUpperCase(), password: data.password }).expect(200);
  expect(loggedIn.body.user).not.toHaveProperty('passwordHash');
  await agent.get('/api/auth/me').expect(200);
  const cleared = await agent.post('/api/auth/logout').set('Origin', origin).expect(200);
  expect(cleared.headers['set-cookie'][0]).toContain(`${SESSION_COOKIE}=;`);
  expect(cleared.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
  expect(cleared.headers['set-cookie'][0]).toContain('HttpOnly');
  expect(cleared.headers['set-cookie'][0]).toContain('SameSite=Lax');
  await agent.get('/api/auth/me').expect(401);
  await agent.post('/api/auth/logout').set('Origin', origin).expect(200);
});

it('uses the same generic response for unknown users and wrong passwords', async () => {
  const data = registration();
  await post('register').send(data).expect(201);
  const wrong = await post('login').send({ email: data.email, password: 'Wrong-password-123' }).expect(401);
  const absent = await post('login').send({ email: registration().email, password: data.password }).expect(401);
  expect(wrong.body).toEqual(absent.body);
  expect(wrong.headers['set-cookie']).toBeUndefined();
});

it('validates login input without enforcing new registration composition rules', async () => {
  const data = registration();
  await User.create({ name: data.name, email: data.email, passwordHash: await bcrypt.hash('legacy', 12) });
  await post('login').send({ email: data.email, password: 'legacy' }).expect(200);
  for (const input of [{}, { email: data.email }, { email: data.email, password: 'x', role: 'admin' }, { email: data.email, password: 'x'.repeat(73) }]) {
    await post('login').send(input).expect(400);
  }
});

it('requires valid sessions, verifies JWT restrictions, and preserves anonymous public access', async () => {
  const created = await post('register').send(registration()).expect(201);
  const id = created.body.user.id;
  await request(boundaries).get('/protected').expect(401);
  await request(app).get('/api/auth/me').expect(401);
  for (const invalid of [
    `${SESSION_COOKIE}=broken`, tokenCookie(id, { expiresIn: -1 }),
    tokenCookie(id, { issuer: 'other' }), tokenCookie(id, { audience: 'other' }),
    tokenCookie(id, { algorithm: 'HS384' }), tokenCookie(id, { notBefore: '1h' }),
    tokenCookie('invalid-id'), tokenCookie(new mongoose.Types.ObjectId().toString()),
    `${SESSION_COOKIE}=${jwt.sign({ sub: id }, 'wrong-secret')}`,
  ]) {
    await request(app).get('/api/auth/me').set('Cookie', invalid).expect(401);
    const response = await request(boundaries).get('/public').set('Cookie', invalid).expect(200);
    expect(response.body.id).toBeNull();
  }
  await request(boundaries).get('/protected').set('Cookie', cookie(created)).expect(200);
});

it('uses current database roles, ignores injected JWT roles and applies changes immediately', async () => {
  const created = await post('register').send(registration()).expect(201);
  const id = created.body.user.id;
  const session = tokenCookie(id, {}, { role: 'admin' });
  await request(boundaries).get('/admin').expect(401);
  await request(boundaries).get('/admin').set('Cookie', session).expect(403);
  await User.updateOne({ _id: id }, { role: 'admin' });
  await request(boundaries).get('/admin').set('Cookie', session).expect(200);
  await User.updateOne({ _id: id }, { role: 'user' });
  await request(boundaries).get('/admin').set('Cookie', session).expect(403);
});

it.each(['register', 'login', 'logout'])('rejects missing, null and cross-site Origin on %s', async endpoint => {
  for (const incoming of [undefined, 'null', 'https://attacker.example', `${origin}.attacker.example`, `${origin}/`]) {
    let operation = request(app).post(`/api/auth/${endpoint}`);
    if (incoming) operation = operation.set('Origin', incoming);
    const response = await operation.send(registration()).expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN_ORIGIN');
    expect(response.headers['set-cookie']).toBeUndefined();
  }
});

it('sets and clears Secure cookies in production and rejects missing production origins', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('APP_ORIGIN', 'https://feedback.example');
  await request(app).post('/api/auth/register').send(registration()).expect(403);
  const result = await request(app).post('/api/auth/register').set('Origin', 'https://feedback.example').send(registration()).expect(201);
  expect(result.headers['set-cookie'][0]).toContain('Secure');
  const cleared = await request(app).post('/api/auth/logout').set('Origin', 'https://feedback.example').expect(200);
  expect(cleared.headers['set-cookie'][0]).toContain('Secure');
  expect(cleared.headers['set-cookie'][0]).toContain('Path=/');
});

it('fails closed for missing/weak secrets and invalid origin configuration', () => {
  vi.stubEnv('JWT_SECRET', 'weak');
  expect(validateAuthConfig).toThrow('JWT_SECRET');
  vi.unstubAllEnvs();
  vi.stubEnv('APP_ORIGIN', 'http://localhost:5173/path');
  expect(validateAuthConfig).toThrow('APP_ORIGIN');
  vi.stubEnv('APP_ORIGIN', 'http://localhost:5173');
  vi.stubEnv('NODE_ENV', 'production');
  expect(validateAuthConfig).toThrow('HTTPS');
});

it('does not disguise database failures as anonymous sessions or expose internals', async () => {
  vi.spyOn(User, 'findById').mockRejectedValue(new Error('private database connection details'));
  const response = await request(boundaries).get('/public')
    .set('Cookie', tokenCookie(new mongoose.Types.ObjectId().toString())).expect(500);
  expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});
