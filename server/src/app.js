import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandler } from './middleware/errorHandler.js';
import { verifyOrigin } from './middleware/verifyOrigin.js';
import authRoutes from './routes/authRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const clientBuild = fileURLToPath(new URL('../../client/dist/', import.meta.url));
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.get('/api/health', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
});
app.use('/api', verifyOrigin);
app.use('/api/auth', authRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientBuild, { index: false }));
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || path.extname(req.path) || !req.accepts('html')) return next();
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});
app.use(errorHandler);

export default app;
