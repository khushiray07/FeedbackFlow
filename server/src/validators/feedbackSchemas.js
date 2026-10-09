import { z } from 'zod';
import { CATEGORIES, STATUSES } from '../models/constants.js';

export const createFeedbackSchema = z.object({
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20).max(2000),
  category: z.enum(CATEGORIES),
}).strict();

const positiveInteger = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().safe().int().positive());
export const listFeedbackSchema = z.object({
  page: positiveInteger.default(1),
  limit: positiveInteger.pipe(z.number().max(50)).default(10),
  search: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  sort: z.enum(['newest', 'most_voted']).default('newest'),
}).strict();

export const updateStatusSchema = z.object({ status: z.enum(STATUSES) }).strict();
