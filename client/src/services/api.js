export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.status = status; this.code = code; }
}
export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'include', signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Could not reach the server. Please try again.', 0, 'NETWORK_ERROR');
  }
  let payload;
  try { payload = await response.json(); } catch { throw new ApiError('The server returned an invalid response.', response.status, 'INVALID_RESPONSE'); }
  if (!response.ok) throw new ApiError(payload?.error?.message || 'Request failed.', response.status, payload?.error?.code);
  return payload;
}
export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try { const url = new URL(value, window.location.origin); return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : '/'; } catch { return '/'; }
}
