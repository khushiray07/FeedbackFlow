import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { assertIsolatedDatabase } from './databaseSafety.js';
import { validateDatabaseTarget } from '../config/db.js';

describe('Express test harness', () => {
  it('reports database readiness without exposing connection details', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
  it('returns JSON for missing API routes without starting the application entry point', async () => {
    const response = await request(app).get('/api/not-implemented').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });
  it('rejects malformed JSON with a safe error', async () => {
    const response = await request(app).post('/api/not-implemented').set('Content-Type', 'application/json').send('{').expect(400);
    expect(response.body).toEqual({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
  });
  it('limits request body size', async () => {
    await request(app).post('/api/not-implemented').send({ content: 'x'.repeat(17000) }).expect(413);
  });
});

describe('Test database safety', () => {
  const safeUri = `mongodb://127.0.0.1:27099/feedbackflow_test_${'a'.repeat(32)}`;
  it('accepts only the generated loopback test database shape', () => {
    expect(() => assertIsolatedDatabase(safeUri, 'test')).not.toThrow();
  });
  it.each([
    'mongodb://127.0.0.1:27017/feedbackflow',
    'mongodb://127.0.0.1:27017/production',
    safeUri.replace('127.0.0.1', 'remote.example.com'),
    safeUri.replace('mongodb:', 'mongodb+srv:'),
    safeUri.replace('127.0.0.1', 'user:password@127.0.0.1'),
    `${safeUri}?dbName=production`,
    'not-a-uri',
  ])('rejects unsafe target %s before connection', uri => {
    expect(() => assertIsolatedDatabase(uri, 'test')).toThrow();
  });
  it('rejects execution outside the test environment', () => {
    expect(() => assertIsolatedDatabase(safeUri, 'production')).toThrow();
  });
  it('does not inherit development or external test database credentials', () => {
    expect(process.env.MONGODB_URI).toBe('');
    expect(process.env.MONGODB_TEST_URI).toBe('');
  });
});

describe('Production database selection', () => {
  it('requires a separate explicit database before connecting', () => {
    expect(() => validateDatabaseTarget('mongodb+srv://cluster.example.net/feedbackflow_prod', 'production')).not.toThrow();
    for (const uri of [
      'mongodb+srv://cluster.example.net/',
      'mongodb+srv://cluster.example.net/test',
      'mongodb+srv://cluster.example.net/feedbackflow',
      'mongodb+srv://cluster.example.net/feedbackflow?dbName=feedbackflow_prod',
    ]) expect(() => validateDatabaseTarget(uri, 'production')).toThrow();
  });
});
