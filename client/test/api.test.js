import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { api, ApiError, safeReturnPath } from '../src/services/api.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; delete globalThis.window; });
test('sends mutations to relative API paths with cookie credentials', async () => {
  let requested;
  globalThis.fetch = async (path, options) => { requested = { path, options }; return { ok: true, json: async () => ({ data: { id: 'one' } }) }; };
  const result = await api('/feedback', { method: 'POST', body: { title: 'An idea' } });
  assert.deepEqual(result, { data: { id: 'one' } });
  assert.equal(requested.path, '/api/feedback');
  assert.equal(requested.options.credentials, 'include');
  assert.equal(requested.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(requested.options.body), { title: 'An idea' });
});
test('surfaces server errors and network errors without success data', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Please log in.' } }) });
  await assert.rejects(api('/feedback'), error => error instanceof ApiError && error.status === 401 && error.code === 'AUTHENTICATION_REQUIRED');
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(api('/feedback'), error => error instanceof ApiError && error.code === 'NETWORK_ERROR');
});
test('allows only internal login return paths', () => {
  globalThis.window = { location: { origin: 'https://feedback.test' } };
  assert.equal(safeReturnPath('/feedback/123?tab=details'), '/feedback/123?tab=details');
  for (const value of ['https://elsewhere.test', '//elsewhere.test', '/\\elsewhere.test', 'feedback/123']) assert.equal(safeReturnPath(value), '/');
});
