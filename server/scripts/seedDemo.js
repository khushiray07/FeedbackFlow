import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Feedback from '../src/models/Feedback.js';
import Vote from '../src/models/Vote.js';
import { CATEGORIES, STATUSES } from '../src/models/constants.js';
import { DEMO_FEEDBACK, DEMO_USERS } from './demoData.js';

const marker = 'feedbackflow-demo-v1';
const key = value => new mongoose.Types.ObjectId(createHash('sha256').update(`${marker}:${value}`).digest('hex').slice(0, 24));
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pair = (user, feedback) => `${user}:${feedback}`;

export function demoManifest() {
  const users = DEMO_USERS.map((name, index) => ({
    _id: key(`user:${index}`), name: `Demo · ${name}`,
    email: `demo-${slug(name)}@feedbackflow.invalid`, role: 'user',
    createdAt: new Date(Date.parse('2026-06-01T12:00:00.000Z') + index * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.parse('2026-06-01T12:00:00.000Z') + index * 24 * 60 * 60 * 1000),
  }));
  const feedback = DEMO_FEEDBACK.map((item, index) => ({
    _id: key(`feedback:${index}`), title: item.title, description: item.description,
    category: item.category, status: item.status, author: users[(index * 5) % users.length]._id,
    createdAt: item.createdAt, updatedAt: item.createdAt, voteCount: item.voteCount,
  }));
  const votes = feedback.flatMap((item, feedbackIndex) => Array.from({ length: item.voteCount }, (_, voteIndex) => {
    const user = users[(feedbackIndex * 7 + voteIndex) % users.length];
    return { _id: key(`vote:${feedbackIndex}:${user.email}`), user: user._id, feedback: item._id,
      createdAt: new Date(item.createdAt.getTime() + (voteIndex + 1) * 60 * 60 * 1000) };
  }));
  if (users.length !== 18 || feedback.length !== 40 || votes.length !== new Set(votes.map(vote => String(vote._id))).size) {
    throw new Error('Demo manifest is inconsistent.');
  }
  for (const item of feedback) {
    if (!CATEGORIES.includes(item.category) || !STATUSES.includes(item.status) || item.title.length < 5 || item.title.length > 100 || item.description.length < 20 || item.description.length > 2000 || item.voteCount > users.length) {
      throw new Error('Demo feedback violates model rules.');
    }
  }
  return { users, feedback, votes };
}

export function assertSeedTarget(uri, environment, database, mode, confirmation) {
  if (!['dry-run', 'apply'].includes(mode) || !database || typeof uri !== 'string') throw new Error('A mode, database, and URI are required.');
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('Invalid database target.'); }
  const pathName = decodeURIComponent(parsed.pathname.slice(1));
  const optionName = parsed.searchParams.get('dbName');
  if (pathName && optionName && pathName !== optionName) throw new Error('Conflicting database names.');
  if ((optionName || pathName) !== database) throw new Error('Database confirmation does not match the URI.');
  const isolated = environment === 'test' && parsed.protocol === 'mongodb:' && parsed.hostname === '127.0.0.1' && parsed.port && !parsed.username && !parsed.password && !parsed.search && !parsed.hash && /^feedbackflow_test_[a-f0-9]{32}$/.test(database);
  const production = environment === 'production' && parsed.protocol === 'mongodb+srv:' && database === 'feedbackflow_prod';
  if (!isolated && !production) throw new Error('Demo seed allows only an isolated local test database or explicit production database.');
  if (mode === 'apply' && confirmation !== database) throw new Error('Apply requires an exact database confirmation.');
}

export async function planDemoSeed() {
  const manifest = demoManifest();
  const [existingUsers, matchingEmails, existingFeedback, existingVotes, voteIds] = await Promise.all([
    User.find({ _id: { $in: manifest.users.map(item => item._id) } }).lean(),
    User.find({ email: { $in: manifest.users.map(item => item.email) } }).lean(),
    Feedback.find({ _id: { $in: manifest.feedback.map(item => item._id) } }).lean(),
    Vote.find({ user: { $in: manifest.users.map(item => item._id) }, feedback: { $in: manifest.feedback.map(item => item._id) } }).lean(),
    Vote.find({ _id: { $in: manifest.votes.map(item => item._id) } }).lean(),
  ]);
  const usersById = new Map(existingUsers.map(item => [String(item._id), item]));
  const userIds = new Map(manifest.users.map(item => [item.email, String(item._id)]));
  for (const item of matchingEmails) if (String(item._id) !== userIds.get(item.email)) throw new Error('A demo email belongs to another account.');
  for (const item of manifest.users) {
    const found = usersById.get(String(item._id));
    if (found && (found.email !== item.email || found.name !== item.name || found.role !== 'user')) throw new Error('A demo user ID belongs to another account.');
  }
  const feedbackById = new Map(existingFeedback.map(item => [String(item._id), item]));
  for (const item of manifest.feedback) {
    const found = feedbackById.get(String(item._id));
    if (found && (found.title !== item.title || found.description !== item.description || found.category !== item.category || String(found.author) !== String(item.author))) throw new Error('A demo feedback ID belongs to another record.');
  }
  const desiredVotes = new Map(manifest.votes.map(item => [String(item._id), pair(item.user, item.feedback)]));
  for (const item of voteIds) if (desiredVotes.get(String(item._id)) !== pair(item.user, item.feedback)) throw new Error('A demo vote ID belongs to another vote.');
  const existingPairs = new Set(existingVotes.map(item => pair(item.user, item.feedback)));
  return {
    users: manifest.users.filter(item => !usersById.has(String(item._id))),
    feedback: manifest.feedback.filter(item => !feedbackById.has(String(item._id))),
    votes: manifest.votes.filter(item => !existingPairs.has(pair(item.user, item.feedback))),
  };
}

export function describePlan(plan, database) {
  const manifest = demoManifest();
  const users = new Map(manifest.users.map(item => [String(item._id), item.name]));
  const feedback = new Map(manifest.feedback.map(item => [String(item._id), item.title]));
  const countBy = (items, field, values) => Object.fromEntries(values.map(value => [value, items.filter(item => item[field] === value).length]));
  return {
    database,
    counts: { users: plan.users.length, feedback: plan.feedback.length, votes: plan.votes.length },
    categories: countBy(plan.feedback, 'category', CATEGORIES),
    statuses: countBy(plan.feedback, 'status', STATUSES),
    users: plan.users.map(item => ({ id: String(item._id), name: item.name, email: item.email, role: item.role,
      createdAt: item.createdAt, updatedAt: item.updatedAt, passwordHash: 'Random bcrypt hash generated only during apply' })),
    feedback: plan.feedback.map(item => ({ id: String(item._id), title: item.title, description: item.description,
      category: item.category, status: item.status, author: users.get(String(item.author)),
      createdAt: item.createdAt, updatedAt: item.updatedAt, plannedVoteCount: item.voteCount })),
    votes: plan.votes.map(item => ({ id: String(item._id), feedback: feedback.get(String(item.feedback)),
      voter: users.get(String(item.user)), createdAt: item.createdAt })),
  };
}

export async function applyDemoSeed() {
  await Promise.all([User.createIndexes(), Feedback.createIndexes(), Vote.createIndexes()]);
  const plan = await planDemoSeed();
  if (plan.users.length) {
    const users = await Promise.all(plan.users.map(async item => ({ ...item,
      passwordHash: await bcrypt.hash(randomBytes(48).toString('base64url'), 12),
    })));
    await User.insertMany(users);
  }
  if (plan.feedback.length) await Feedback.insertMany(plan.feedback.map(({ voteCount: _voteCount, ...item }) => item));
  if (plan.votes.length) await Vote.insertMany(plan.votes);
  return plan;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const mode = args.includes('--dry-run') ? 'dry-run' : args.includes('--apply') ? 'apply' : null;
  const database = args[args.indexOf('--database') + 1];
  const confirmation = args[args.indexOf('--confirm') + 1];
  try {
    if (args.filter(arg => ['--dry-run', '--apply'].includes(arg)).length !== 1 || args.some(arg => !['--dry-run', '--apply', '--database', '--confirm', database, confirmation].includes(arg))) throw new Error('Invalid seed arguments.');
    assertSeedTarget(process.env.MONGODB_URI, process.env.NODE_ENV, database, mode, confirmation);
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, autoIndex: false });
    const plan = mode === 'dry-run' ? await planDemoSeed() : await applyDemoSeed();
    console.log(JSON.stringify({ mode, ...describePlan(plan, database) }, null, 2));
  } catch {
    // Driver errors can include credentials. Keep all failures generic in CLI output.
    console.error('Demo seed did not complete. Earlier inserts may have succeeded; rerun a dry-run to inspect the remaining records.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
