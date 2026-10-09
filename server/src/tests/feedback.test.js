import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { expect, it } from 'vitest';
import app from '../app.js';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';
import User from '../models/User.js';

const origin = 'http://localhost:5173';
const payload = (title = 'Useful feedback') => ({ title, description: 'This is a detailed and useful description.', category: 'feature' });
async function account() {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/register').set('Origin', origin).send({
    name: 'Test Author', email: `${randomUUID()}@example.test`, password: 'Valid-password-42',
  }).expect(201);
  return { agent, id: response.body.user.id };
}
const submit = (agent, data) => agent.post('/api/feedback').set('Origin', origin).send(data);

it('creates feedback with server-owned author and status, and returns safe public details', async () => {
  const { agent, id } = await account();
  await request(app).post('/api/feedback').set('Origin', origin).send(payload()).expect(401);
  const created = await submit(agent, payload()).expect(201);
  expect(created.body.data).toMatchObject({ title: 'Useful feedback', status: 'under_review', author: { id, name: 'Test Author' }, voteCount: 0, hasVoted: false });
  expect(created.body.data.author).not.toHaveProperty('email');
  const saved = await Feedback.findById(created.body.data.id);
  expect(String(saved.author)).toBe(id);
  expect(saved.status).toBe('under_review');
  const detail = await request(app).get(`/api/feedback/${saved.id}`).expect(200);
  expect(detail.body.data).toMatchObject({ id: String(saved.id), voteCount: 0, hasVoted: false });
  expect(detail.headers['cache-control']).toBe('no-store');
});

it('rejects invalid feedback bodies and protected fields', async () => {
  const { agent, id } = await account();
  for (const bad of [
    { ...payload(), title: 'abcd' }, { ...payload(), title: 'x'.repeat(101) },
    { ...payload(), description: 'too short' }, { ...payload(), description: 'x'.repeat(2001) },
    { ...payload(), category: 'other' }, { ...payload(), author: id },
    { ...payload(), status: 'completed' }, { ...payload(), voteCount: 900 },
  ]) await submit(agent, bad).expect(400);
  expect(await Feedback.countDocuments({ author: id })).toBe(0);
});

it('handles malformed and absent feedback IDs', async () => {
  await request(app).get('/api/feedback/not-an-id').expect(400);
  await request(app).get(`/api/feedback/${new mongoose.Types.ObjectId()}`).expect(404);
});

it('searches escaped text and combines filters with accurate totals', async () => {
  const { id } = await account();
  await Feedback.create([
    { ...payload('Dark mode [soon]'), author: id },
    { ...payload('A separate request'), description: 'We should enable DARK mode for everyone.', category: 'bug', author: id },
    { ...payload('Other item here'), category: 'feature', status: 'planned', author: id },
  ]);
  const found = await request(app).get('/api/feedback').query({ search: 'dark', category: 'feature', status: 'under_review' }).expect(200);
  expect(found.body.pagination).toMatchObject({ totalItems: 1, totalPages: 1 });
  expect(found.body.data.map(item => item.title)).toEqual(['Dark mode [soon]']);
  const literal = await request(app).get('/api/feedback').query({ search: '[soon]' }).expect(200);
  expect(literal.body.pagination.totalItems).toBe(1);
  const empty = await request(app).get('/api/feedback').query({ search: 'missing' }).expect(200);
  expect(empty.body).toMatchObject({ data: [], pagination: { totalItems: 0, totalPages: 0 } });
});

it('sorts the full set before pagination and returns current-user voting state', async () => {
  const { agent, id } = await account();
  const voter = await User.create({ name: 'Another Voter', email: `${randomUUID()}@example.test`, passwordHash: 'unused' });
  const records = [];
  for (let index = 0; index < 12; index++) records.push(await Feedback.create({ ...payload(`Feedback item ${index}`), category: 'integration', author: id }));
  await Vote.create([{ user: id, feedback: records[0]._id }, { user: voter.id, feedback: records[0]._id }]);
  const newest = await agent.get('/api/feedback').query({ limit: 5, category: 'integration' }).expect(200);
  expect(newest.body.pagination).toEqual({ page: 1, limit: 5, totalItems: 12, totalPages: 3 });
  expect(newest.body.data).toHaveLength(5);
  expect(newest.body.data[0].id).toBe(String(records[11]._id));
  const ranked = await agent.get('/api/feedback').query({ sort: 'most_voted', limit: 5, category: 'integration' }).expect(200);
  expect(ranked.body.data[0]).toMatchObject({ id: String(records[0]._id), voteCount: 2, hasVoted: true });
  const anonymous = await request(app).get(`/api/feedback/${records[0].id}`).expect(200);
  expect(anonymous.body.data).toMatchObject({ voteCount: 2, hasVoted: false });
  const secondPage = await agent.get('/api/feedback').query({ sort: 'most_voted', page: 2, limit: 5, category: 'integration' }).expect(200);
  expect(secondPage.body.pagination.totalItems).toBe(12);
  expect(secondPage.body.data).toHaveLength(5);
  expect(secondPage.body.data.map(item => item.id)).not.toContain(String(records[0].id));
});

it.each([{ page: '0' }, { page: '-1' }, { page: '1.5' }, { limit: '51' }, { limit: '0' }, { search: 'x'.repeat(101) }, { category: 'invalid' }, { status: 'invalid' }, { sort: 'oldest' }, { extra: 'value' }])('rejects invalid list query %j', async query => {
  const response = await request(app).get('/api/feedback').query(query).expect(400);
  expect(response.body.error.code).toBe('VALIDATION_ERROR');
});
