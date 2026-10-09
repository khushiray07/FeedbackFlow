import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { beforeAll, afterAll, inject } from 'vitest';
import { assertIsolatedDatabase } from './databaseSafety.js';
import { initializeModels } from '../models/initialize.js';

beforeAll(async () => {
  // Each test file gets a new database. No deleteMany or dropDatabase cleanup
  // is needed: stopping the owned MongoDB process removes its temporary files.
  const uri = new URL(inject('mongoBaseUri'));
  uri.pathname = `/feedbackflow_test_${randomUUID().replaceAll('-', '')}`;
  assertIsolatedDatabase(uri.href, process.env.NODE_ENV);
  await mongoose.connect(uri.href, { serverSelectionTimeoutMS: 5000 });
  await initializeModels();
});

afterAll(async () => { await mongoose.disconnect(); });
