import mongoose from 'mongoose';
import { initializeModels } from '../models/initialize.js';

export function validateDatabaseTarget(uri, environment = process.env.NODE_ENV) {
  if (!uri) throw new Error('MONGODB_URI is required. Configure the repository-root .env file.');
  if (environment !== 'production') return;
  let database;
  try {
    const parsed = new URL(uri);
    const pathName = decodeURIComponent(parsed.pathname.slice(1));
    const optionName = parsed.searchParams.get('dbName');
    if (pathName && optionName && pathName !== optionName) throw new Error('Conflicting database names.');
    database = optionName || pathName;
  } catch {
    throw new Error('Production MONGODB_URI must explicitly select a database.');
  }
  if (!database || ['test', 'feedbackflow'].includes(database)) {
    throw new Error('Production MONGODB_URI must select a separate, explicit production database.');
  }
}

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  validateDatabaseTarget(uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch {
    // Driver messages may contain connection details; keep credentials out of logs.
    throw new Error('MongoDB connection failed. Check MONGODB_URI and database availability.');
  }
  try {
    await initializeModels();
  } catch {
    await mongoose.disconnect();
    throw new Error('MongoDB index initialization failed. Check database permissions and duplicate records.');
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
