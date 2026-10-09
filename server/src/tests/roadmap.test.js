import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { expect, it } from 'vitest';
import app from '../app.js';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';
import User from '../models/User.js';

async function author() {
  return User.create({ name: 'Roadmap Author', email: `${randomUUID()}@example.test`, passwordHash: 'unused' });
}
async function item(authorId, status, title, createdAt) {
  return Feedback.create({ title, description: 'A complete description for roadmap feedback.', category: 'feature', status, author: authorId, ...(createdAt ? { createdAt } : {}) });
}

it('serves all four empty status groups publicly', async () => {
  const response = await request(app).get('/api/roadmap').expect(200);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.body.limitPerStatus).toBe(10);
  expect(Object.keys(response.body.groups)).toEqual(['under_review', 'planned', 'in_progress', 'completed']);
  for (const group of Object.values(response.body.groups)) expect(group).toEqual({ items: [], totalItems: 0 });
});

it('groups records, caps each group, and sorts by votes then creation time and ID', async () => {
  const user = await author();
  const voter = await author();
  const tiedAt = new Date('2024-01-01T00:00:00Z');
  const a = await item(user.id, 'under_review', 'Roadmap tie alpha', tiedAt);
  const b = await item(user.id, 'under_review', 'Roadmap tie bravo', tiedAt);
  const high = await item(user.id, 'under_review', 'Roadmap high votes', new Date('2023-01-01T00:00:00Z'));
  const extra = [];
  for (let index = 0; index < 9; index++) extra.push(await item(user.id, 'under_review', `Roadmap extra ${index}`));
  const planned = await item(user.id, 'planned', 'Roadmap planned item');
  const progress = await item(user.id, 'in_progress', 'Roadmap work underway');
  const completed = await item(user.id, 'completed', 'Roadmap completed item');
  await Vote.create([{ user: user.id, feedback: high.id }, { user: voter.id, feedback: high.id }]);
  const response = await request(app).get('/api/roadmap').expect(200);
  const groups = response.body.groups;
  expect(groups.under_review.totalItems).toBe(12);
  expect(groups.under_review.items).toHaveLength(10);
  expect(groups.under_review.items[0]).toMatchObject({ id: high.id, title: high.title, category: 'feature', status: 'under_review', voteCount: 2, hasVoted: false, author: { id: user.id, name: user.name } });
  expect(groups.under_review.items[0].createdAt).toBeTruthy();
  expect(groups.under_review.items.some(value => value.id === a.id)).toBe(false);
  expect(groups.under_review.items.some(value => value.id === b.id)).toBe(false);
  expect(groups.planned).toMatchObject({ totalItems: 1, items: [{ id: planned.id }] });
  expect(groups.in_progress).toMatchObject({ totalItems: 1, items: [{ id: progress.id }] });
  expect(groups.completed).toMatchObject({ totalItems: 1, items: [{ id: completed.id }] });
  // Move newer unvoted records out of the group so the fixed-time tie is visible.
  await Feedback.updateMany({ _id: { $in: extra.map(value => value.id) } }, { $set: { status: 'planned' } });
  const tied = await request(app).get('/api/roadmap').expect(200);
  const ids = tied.body.groups.under_review.items.map(value => value.id);
  expect(ids).toEqual([high.id, b.id, a.id]);
  expect(tied.body.groups.planned.totalItems).toBe(10);
});

it('keeps new low-vote requests discoverable from the status-filtered newest board page', async () => {
  const user = await author();
  const existingUnderReview = await Feedback.countDocuments({ status: 'under_review' });
  const older = [];
  for (let index = 0; index < 10; index++) {
    older.push(await item(user.id, 'under_review', `Older request ${index}`, new Date(`2026-09-${String(20 - index).padStart(2, '0')}T12:00:00Z`)));
  }
  await Vote.create(older.map(record => ({ user: user.id, feedback: record._id })));

  const newPosts = [
    await item(user.id, 'under_review', 'M10 browser verification 2026-10-09', new Date(Date.now() + 60_000)),
    await item(user.id, 'under_review', 'Fix the dropdown thing in searching', new Date(Date.now() + 120_000)),
  ];

  const roadmap = await request(app).get('/api/roadmap').expect(200);
  const underReview = roadmap.body.groups.under_review;
  expect(underReview.totalItems).toBe(existingUnderReview + 12);
  expect(underReview.items).toHaveLength(10);
  expect(underReview.items.some(record => newPosts.some(post => record.id === post.id))).toBe(false);

  const statusBoard = await request(app).get('/api/feedback').query({ status: 'under_review' }).expect(200);
  expect(statusBoard.body.pagination).toMatchObject({ page: 1, totalItems: existingUnderReview + 12, totalPages: 2 });
  expect(statusBoard.body.data.slice(0, 2).map(record => record.title)).toEqual([
    'Fix the dropdown thing in searching',
    'M10 browser verification 2026-10-09',
  ]);
});
