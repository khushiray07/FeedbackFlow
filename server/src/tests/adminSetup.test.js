import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { createAdmin } from '../../scripts/seedAdmin.js';

it('creates a controlled admin with a hashed password and refuses to replace an existing account', async () => {
  const input = { name: 'Setup Admin', email: `${randomUUID()}@example.test`, password: 'Temporary-test-password-42' };
  const admin = await createAdmin(input);
  const saved = await User.findById(admin.id).select('+passwordHash');
  expect(saved.role).toBe('admin');
  expect(saved.passwordHash).not.toBe(input.password);
  expect(await bcrypt.compare(input.password, saved.passwordHash)).toBe(true);
  await expect(createAdmin({ ...input, password: 'Different-password-99' })).rejects.toMatchObject({ code: 11000 });
  expect((await User.findById(admin.id).select('+passwordHash')).passwordHash).toBe(saved.passwordHash);
});

it('rejects invalid setup passwords without writing a user', async () => {
  const email = `${randomUUID()}@example.test`;
  for (const password of ['short1', 'no-number-here', `1${'x'.repeat(72)}`, `1${'é'.repeat(36)}`]) {
    await expect(createAdmin({ name: 'Setup Admin', email, password })).rejects.toThrow();
  }
  expect(await User.countDocuments({ email })).toBe(0);
});
