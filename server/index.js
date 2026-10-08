import app from './src/app.js';
import { connectDatabase, disconnectDatabase } from './src/config/db.js';

let server;
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDatabase();
  clearTimeout(deadline);
}

try {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  await connectDatabase();
  server = app.listen(port, '127.0.0.1', () => console.log(`FeedbackFlow API listening on port ${port}`));
  server.on('error', async () => {
    console.error('API listener failed. Check PORT availability.');
    await disconnectDatabase();
    process.exitCode = 1;
  });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(error.message);
  await disconnectDatabase();
  process.exitCode = 1;
}
