import mongoose from 'mongoose';
import { initializeModels } from '../models/initialize.js';

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is required. Configure the repository-root .env file.');
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
