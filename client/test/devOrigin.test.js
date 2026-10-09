import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canonicalDevUrl } from '../devOrigin.js';
const origin = 'http://127.0.0.1:5173';
test('redirects HTML navigation from an alternate host to the configured origin', () => {
  assert.equal(canonicalDevUrl({ method: 'GET', url: '/login?returnTo=%2F', headers: { host: 'localhost:5173', accept: 'text/html' } }, origin), 'http://127.0.0.1:5173/login?returnTo=%2F');
  assert.equal(canonicalDevUrl({ method: 'GET', url: '/', headers: { host: '127.0.0.1:5173', accept: 'text/html' } }, origin), null);
});
test('does not redirect API mutations or asset requests', () => {
  assert.equal(canonicalDevUrl({ method: 'POST', url: '/api/auth/login', headers: { host: 'localhost:5173', accept: 'text/html' } }, origin), null);
  assert.equal(canonicalDevUrl({ method: 'GET', url: '/api/feedback', headers: { host: 'localhost:5173', accept: 'text/html' } }, origin), null);
  assert.equal(canonicalDevUrl({ method: 'GET', url: '/src/App.jsx', headers: { host: 'localhost:5173', accept: '*/*' } }, origin), null);
});
