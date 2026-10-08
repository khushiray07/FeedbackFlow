import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';

const userData = () => ({ name: 'Test User', email: `${randomUUID()}@example.test`, passwordHash: 'test-only-hash' });
const feedbackData = (author = new mongoose.Types.ObjectId()) => ({
  title: 'Improve keyboard navigation', description: 'Allow keyboard navigation through all feedback cards.',
  category: 'improvement', author,
});

describe('User', () => {
  it('normalizes email, defaults role and excludes the hash from normal reads and JSON', async () => {
    const data = userData();
    const user = await User.create({ ...data, email: ` ${data.email.toUpperCase()} ` });
    expect(user.email).toBe(data.email);
    expect(user.role).toBe('user');
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect((await User.findById(user.id)).passwordHash).toBeUndefined();
    const selected = await User.findById(user.id).select('+passwordHash');
    expect(selected.passwordHash).toBe(data.passwordHash);
    expect(selected.toJSON()).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate normalized emails in the database', async () => {
    const data = userData();
    await User.create(data);
    await expect(User.create({ ...data, email: data.email.toUpperCase() })).rejects.toMatchObject({ code: 11000 });
  });

  it.each([
    ['name', 'x'], ['name', 'x'.repeat(81)], ['email', 'invalid'],
    ['passwordHash', ''], ['role', 'owner'],
  ])('rejects invalid %s values', async (field, value) => {
    await expect(User.create({ ...userData(), [field]: value })).rejects.toMatchObject({ name: 'ValidationError' });
  });
});

describe('Feedback', () => {
  it('persists content, defaults status and resolves its author reference', async () => {
    const user = await User.create(userData());
    const feedback = await Feedback.create(feedbackData(user._id));
    const loaded = await Feedback.findById(feedback.id).populate('author');
    expect(loaded.status).toBe('under_review');
    expect(loaded.author.id).toBe(user.id);
    expect(loaded.author.passwordHash).toBeUndefined();
    expect(loaded.createdAt).toBeInstanceOf(Date);
  });

  it.each([
    ['title', 'abcd'], ['title', 'a'.repeat(101)],
    ['description', 'a'.repeat(19)], ['description', 'a'.repeat(2001)],
    ['category', 'other'], ['status', 'shipped'], ['author', null], ['author', 'bad-id'],
  ])('rejects invalid %s values', async (field, value) => {
    await expect(Feedback.create({ ...feedbackData(), [field]: value })).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('accepts exact title and description limits and every documented enum', async () => {
    for (const [category, status] of [['feature', 'under_review'], ['improvement', 'planned'], ['bug', 'in_progress'], ['integration', 'completed']]) {
      await expect(Feedback.create({ ...feedbackData(), category, status, title: 'a'.repeat(5), description: 'a'.repeat(20) })).resolves.toBeDefined();
    }
    await expect(Feedback.create({ ...feedbackData(), title: 'a'.repeat(100), description: 'a'.repeat(2000) })).resolves.toBeDefined();
  });
});

describe('Vote and database indexes', () => {
  it('enforces uniqueness under concurrent writes and allows independent voters', async () => {
    const user = await User.create(userData());
    const other = await User.create(userData());
    const feedback = await Feedback.create(feedbackData(user._id));
    const vote = { user: user._id, feedback: feedback._id };
    const outcomes = await Promise.allSettled(Array.from({ length: 8 }, () => Vote.create(vote)));
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    for (const result of outcomes.filter(result => result.status === 'rejected')) expect(result.reason.code).toBe(11000);
    await Vote.create({ user: other._id, feedback: feedback._id });
    expect(await Vote.countDocuments({ feedback: feedback._id })).toBe(2);
    const loaded = await Vote.findOne(vote).populate('user feedback');
    expect(loaded.user.id).toBe(user.id);
    expect(loaded.feedback.id).toBe(feedback.id);
    expect(loaded.createdAt).toBeInstanceOf(Date);
    expect(loaded.updatedAt).toBeUndefined();
  });

  it('requires valid user and feedback references', async () => {
    await expect(Vote.create({})).rejects.toMatchObject({ name: 'ValidationError' });
    await expect(Vote.create({ user: 'bad-id', feedback: 'bad-id' })).rejects.toMatchObject({ name: 'ValidationError' });
  });

  it('creates the actual required indexes in MongoDB', async () => {
    const users = await User.collection.indexes();
    const feedback = await Feedback.collection.indexes();
    const votes = await Vote.collection.indexes();
    expect(users).toEqual(expect.arrayContaining([expect.objectContaining({ key: { email: 1 }, unique: true })]));
    for (const key of [{ createdAt: -1 }, { status: 1, createdAt: -1 }, { category: 1, createdAt: -1 }]) {
      expect(feedback).toEqual(expect.arrayContaining([expect.objectContaining({ key })]));
    }
    expect(votes).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: { user: 1, feedback: 1 }, unique: true }),
      expect.objectContaining({ key: { feedback: 1 } }),
    ]));
  });
});
