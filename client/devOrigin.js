// Keep development page navigation on the exact origin accepted by Express.
// API mutations are never redirected; Express still validates their Origin.
export function canonicalDevUrl(request, configuredOrigin) {
  if (request.method !== 'GET' || !request.headers.accept?.includes('text/html') || request.url?.startsWith('/api')) return null;
  const origin = new URL(configuredOrigin);
  if (request.headers.host?.toLowerCase() === origin.host.toLowerCase()) return null;
  return `${origin.origin}${request.url || '/'}`;
}
