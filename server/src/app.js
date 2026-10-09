import express from 'express';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { verifyOrigin } from './middleware/verifyOrigin.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use('/api', verifyOrigin);
app.use('/api/auth', authRoutes);
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});
app.use(errorHandler);

export default app;
