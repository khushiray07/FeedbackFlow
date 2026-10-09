import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { adminAccessState, adminFeedbackPath, adminStatsPath, roadmapPath, statusCounts, updateFeedbackStatus } from '../src/services/management.js';
import { api, ApiError } from '../src/services/api.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
test('loads public roadmap groups and totals from the backend', async () => {
  let path;
  const groups = { under_review: { items: [], totalItems: 0 }, planned: { items: [{ id: 'abc' }], totalItems: 11 }, in_progress: { items: [], totalItems: 0 }, completed: { items: [], totalItems: 0 } };
  globalThis.fetch = async requested => { path = requested; return { ok: true, json: async () => ({ groups, limitPerStatus: 10 }) }; };
  const result = await api(roadmapPath);
  assert.equal(path, '/api/roadmap');
  assert.deepEqual(result.groups, groups);
  assert.equal(result.groups.planned.totalItems, 11);
  assert.equal(result.limitPerStatus, 10);
});
test('builds the paginated admin list query and maps all status totals', () => {
  assert.equal(adminStatsPath, '/admin/stats');
  assert.equal(adminFeedbackPath({ page: 2, search: 'dark mode', status: 'planned' }), '/feedback?page=2&limit=10&sort=newest&search=dark+mode&status=planned');
  assert.deepEqual(statusCounts({ underReview: 1, planned: 2, inProgress: 3, completed: 4 }), { under_review: 1, planned: 2, in_progress: 3, completed: 4 });
});
test('sends status changes to the protected API and reports denied updates', async () => {
  let request;
  globalThis.fetch = async (path, options) => { request = { path, options }; return { ok: true, json: async () => ({ data: { id: 'abc', status: 'planned' } }) }; };
  assert.deepEqual(await updateFeedbackStatus('abc', 'planned'), { data: { id: 'abc', status: 'planned' } });
  assert.equal(request.path, '/api/feedback/abc/status');
  assert.equal(request.options.method, 'PATCH');
  assert.equal(request.options.credentials, 'include');
  assert.deepEqual(JSON.parse(request.options.body), { status: 'planned' });
  globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } }) });
  await assert.rejects(updateFeedbackStatus('abc', 'completed'), error => error instanceof ApiError && error.status === 403 && error.code === 'FORBIDDEN');
});

test('guards admin access for loading, visitors, users and administrators', () => {
  assert.equal(adminAccessState({ loading: true, user: null }), 'loading');
  assert.equal(adminAccessState({ loading: false, user: null }), 'unauthenticated');
  assert.equal(adminAccessState({ loading: false, user: null, sessionError: 'offline' }), 'session_error');
  assert.equal(adminAccessState({ loading: false, user: { role: 'user' } }), 'forbidden');
  assert.equal(adminAccessState({ loading: false, user: { role: 'admin' } }), 'allowed');
});
