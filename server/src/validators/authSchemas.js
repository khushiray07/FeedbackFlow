import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(1).refine(value => Buffer.byteLength(value, 'utf8') <= 72);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80), email,
  password: password.refine(value => value.length >= 8 && /\d/.test(value)),
}).strict();

export const loginSchema = z.object({ email, password }).strict();
