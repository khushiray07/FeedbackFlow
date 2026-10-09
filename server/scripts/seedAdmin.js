import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';

export async function createAdmin({ name, email, password }) {
  if (typeof password !== 'string' || password.length < 8 || !/\d/.test(password) || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Admin password requires at least 8 characters, one number, and at most 72 UTF-8 bytes.');
  }
  // Validate before the expensive hash, and never reset or promote an existing user.
  const admin = new User({ name, email, passwordHash: 'pending', role: 'admin' });
  await admin.validate();
  admin.passwordHash = await bcrypt.hash(password, 12);
  return admin.save();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { ADMIN_NAME: name, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
    if (!name || !email || !password) throw new Error('Admin configuration missing.');
    await connectDatabase();
    await createAdmin({ name, email, password });
    console.log('Administrator created. Remove ADMIN_PASSWORD from your local environment.');
  } catch {
    // Validation/driver errors can contain submitted values: do not log them.
    console.error('Admin creation failed. Check database access, input constraints, and whether the email already exists. No existing account was changed.');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}
