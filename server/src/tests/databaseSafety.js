export function assertIsolatedDatabase(uri, nodeEnv) {
  if (nodeEnv !== 'test') throw new Error('Database tests require NODE_ENV=test.');
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('Invalid isolated database URI.'); }
  if (
    parsed.protocol !== 'mongodb:' || parsed.hostname !== '127.0.0.1' ||
    !parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash ||
    !/^\/feedbackflow_test_[a-f0-9]{32}$/.test(parsed.pathname)
  ) throw new Error('Only the generated local test database is allowed.');
}
