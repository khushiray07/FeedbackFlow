import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';
import { listFeedback } from '../services/feedbackService.js';
import { applyDemoSeed, assertSeedTarget, describePlan, demoManifest, planDemoSeed } from '../../scripts/seedDemo.js';

it('limits demo seeding to a confirmed isolated or production database', () => {
  const isolated = `mongodb://127.0.0.1:27099/feedbackflow_test_${'a'.repeat(32)}`;
  expect(() => assertSeedTarget(isolated, 'test', `feedbackflow_test_${'a'.repeat(32)}`, 'dry-run')).not.toThrow();
  expect(() => assertSeedTarget(isolated, 'test', `feedbackflow_test_${'a'.repeat(32)}`, 'apply')).toThrow();
  expect(() => assertSeedTarget('mongodb+srv://cluster.example.net/feedbackflow_prod', 'production', 'feedbackflow_prod', 'apply', 'feedbackflow_prod')).not.toThrow();
  for (const uri of ['mongodb+srv://cluster.example.net/test', 'mongodb+srv://cluster.example.net/feedbackflow', 'mongodb+srv://cluster.example.net/']) {
    expect(() => assertSeedTarget(uri, 'production', 'feedbackflow_prod', 'apply', 'feedbackflow_prod')).toThrow();
  }
  expect(() => assertSeedTarget(isolated, 'development', 'feedbackflow_test_' + 'a'.repeat(32), 'dry-run')).toThrow();
});

it('dry-runs exactly, inserts through the models, preserves existing data, and resumes idempotently', async () => {
  const user = await User.create({ name: 'Existing Person', email: `${randomUUID()}@example.test`, passwordHash: 'existing-hash', role: 'user' });
  const realFeedback = await Feedback.create({ title: 'Existing request', description: 'This record must remain unchanged by the demo seed.', category: 'feature', status: 'planned', author: user._id });
  const realVote = await Vote.create({ user: user._id, feedback: realFeedback._id });
  const before = { users: await User.countDocuments(), feedback: await Feedback.countDocuments(), votes: await Vote.countDocuments() };
  const preview = await planDemoSeed();
  const report = describePlan(preview, 'isolated-test');
  expect(report.counts).toEqual({ users: 18, feedback: 40, votes: 375 });
  expect(report.categories).toEqual({ feature: 10, improvement: 10, bug: 10, integration: 10 });
  expect(report.statuses).toEqual({ under_review: 12, planned: 10, in_progress: 10, completed: 8 });
  expect(report.users).toHaveLength(18);
  expect(report.feedback).toHaveLength(40);
  expect(report.votes).toHaveLength(375);
  expect(await User.countDocuments()).toBe(before.users);
  expect(await Feedback.countDocuments()).toBe(before.feedback);
  expect(await Vote.countDocuments()).toBe(before.votes);

  // Simulate an interrupted earlier run: a few users, one post, and two votes exist.
  const partial = demoManifest();
  await User.insertMany(partial.users.slice(0, 3).map(item => ({ ...item, passwordHash: 'isolated-test-hash' })));
  await Feedback.insertMany(partial.feedback.slice(0, 1).map(({ voteCount: _voteCount, ...item }) => item));
  await Vote.insertMany(partial.votes.slice(0, 2));
  const remaining = describePlan(await planDemoSeed(), 'isolated-test');
  expect(remaining.counts).toEqual({ users: 15, feedback: 39, votes: 373 });

  const inserted = await applyDemoSeed();
  expect(inserted.users).toHaveLength(15);
  expect(inserted.feedback).toHaveLength(39);
  expect(inserted.votes).toHaveLength(373);
  expect(await User.countDocuments()).toBe(before.users + 18);
  expect(await Feedback.countDocuments()).toBe(before.feedback + 40);
  expect(await Vote.countDocuments()).toBe(before.votes + 375);
  expect(await User.findById(user.id).select('+passwordHash')).toMatchObject({ name: 'Existing Person', passwordHash: 'existing-hash' });
  expect((await Feedback.findById(realFeedback.id)).status).toBe('planned');
  expect(await Vote.exists({ _id: realVote._id })).toBeTruthy();
  expect(new Set((await Feedback.find({ _id: { $in: partial.feedback.map(item => item._id) } }).select('createdAt')).map(item => item.createdAt.toISOString())).size).toBe(40);
  const ranked = await listFeedback({ page: 1, limit: 10, search: '[Demo]', sort: 'most_voted' });
  expect(ranked.pagination.totalItems).toBe(40);
  expect(ranked.data[0].voteCount).toBe(17);
  expect(ranked.data.map(item => item.voteCount)).toEqual([...ranked.data.map(item => item.voteCount)].sort((a, b) => b - a));
  const allRanked = await listFeedback({ page: 1, limit: 50, search: '[Demo]', sort: 'most_voted' });
  const actualById = new Map(allRanked.data.map(item => [item.id, item.voteCount]));
  for (const item of partial.feedback) {
    expect(await Vote.countDocuments({ feedback: item._id })).toBe(item.voteCount);
    expect(actualById.get(String(item._id))).toBe(item.voteCount);
  }

  await Feedback.updateOne({ _id: inserted.feedback[0]._id }, { $set: { status: 'completed' } });
  expect(describePlan(await planDemoSeed(), 'isolated-test').counts).toEqual({ users: 0, feedback: 0, votes: 0 });
  expect(describePlan(await applyDemoSeed(), 'isolated-test').counts).toEqual({ users: 0, feedback: 0, votes: 0 });
  expect((await Feedback.findById(inserted.feedback[0]._id)).status).toBe('completed');
  await Vote.deleteOne({ _id: inserted.votes[0]._id });
  expect(describePlan(await planDemoSeed(), 'isolated-test').counts).toEqual({ users: 0, feedback: 0, votes: 1 });
  expect(describePlan(await applyDemoSeed(), 'isolated-test').counts).toEqual({ users: 0, feedback: 0, votes: 1 });
  expect(await Vote.countDocuments()).toBe(before.votes + 375);
}, 60000);
