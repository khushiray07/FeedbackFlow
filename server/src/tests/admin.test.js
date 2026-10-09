import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { expect, it } from 'vitest';
import app from '../app.js';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';
import User from '../models/User.js';

const origin = 'http://localhost:5173';
async function account(role = 'user') {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/register').set('Origin', origin).send({
    name: 'Dashboard User', email: `${randomUUID()}@example.test`, password: 'Valid-password-42',
  }).expect(201);
  if (role === 'admin') await User.updateOne({ _id: response.body.user.id }, { role: 'admin' });
  return { agent, id: response.body.user.id };
}
async function feedback(author, status = 'under_review') {
  return Feedback.create({ title: `Status item ${randomUUID()}`, description: 'A sufficiently detailed feedback description.', category: 'bug', status, author });
}
const patch = (agent, id, body) => agent.patch(`/api/feedback/${id}/status`).set('Origin', origin).send(body);

it('protects stats and status updates from visitors and regular users', async () => {
  const member = await account();
  const target = await feedback(member.id);
  await request(app).get('/api/admin/stats').expect(401);
  await member.agent.get('/api/admin/stats').expect(403);
  await request(app).patch(`/api/feedback/${target.id}/status`).set('Origin', origin).send({ status: 'planned' }).expect(401);
  await patch(member.agent, target.id, { status: 'planned' }).expect(403);
  expect((await Feedback.findById(target.id)).status).toBe('under_review');
  await Feedback.deleteOne({ _id: target.id });
});

it('returns accurate status and vote totals, then reflects an admin update across reads', async () => {
  const admin = await account('admin');
  const member = await account();
  const target = await feedback(member.id);
  const other = await feedback(member.id, 'planned');
  await feedback(member.id, 'completed');
  await Vote.create([{ user: admin.id, feedback: target.id }, { user: member.id, feedback: target.id }, { user: member.id, feedback: other.id }]);
  const initial = await admin.agent.get('/api/admin/stats').expect(200);
  expect(initial.body).toEqual({ totalFeedback: 3, totalVotes: 3, underReview: 1, planned: 1, inProgress: 0, completed: 1 });
  expect(initial.headers['cache-control']).toBe('no-store');
  const updated = await patch(admin.agent, target.id, { status: 'in_progress' }).expect(200);
  expect(updated.body.data).toMatchObject({ id: target.id, status: 'in_progress', voteCount: 2, hasVoted: true });
  expect((await Feedback.findById(target.id)).status).toBe('in_progress');
  expect((await admin.agent.get(`/api/feedback/${target.id}`).expect(200)).body.data.status).toBe('in_progress');
  expect((await request(app).get('/api/feedback').query({ status: 'under_review' }).expect(200)).body.pagination.totalItems).toBe(0);
  expect((await request(app).get('/api/feedback').query({ status: 'in_progress' }).expect(200)).body.data[0].id).toBe(target.id);
  const groups = (await request(app).get('/api/roadmap').expect(200)).body.groups;
  expect(groups.under_review.totalItems).toBe(0);
  expect(groups.in_progress.items[0].id).toBe(target.id);
  expect((await admin.agent.get('/api/admin/stats').expect(200)).body).toEqual({ totalFeedback: 3, totalVotes: 3, underReview: 0, planned: 1, inProgress: 1, completed: 1 });
});

it('rejects invalid status bodies and feedback IDs', async () => {
  const admin = await account('admin');
  const target = await feedback(admin.id);
  for (const body of [{ status: 'invalid' }, { status: 'planned', author: admin.id }, {}, { status: 12 }]) {
    expect((await patch(admin.agent, target.id, body).expect(400)).body.error.code).toBe('VALIDATION_ERROR');
  }
  expect((await patch(admin.agent, 'invalid', { status: 'planned' }).expect(400)).body.error.code).toBe('INVALID_ID');
  expect((await patch(admin.agent, new mongoose.Types.ObjectId(), { status: 'planned' }).expect(404)).body.error.code).toBe('NOT_FOUND');
  expect((await Feedback.findById(target.id)).status).toBe('under_review');
});

it('enforces origin checks for status mutations', async () => {
  const admin = await account('admin');
  const target = await feedback(admin.id);
  await admin.agent.patch(`/api/feedback/${target.id}/status`).send({ status: 'planned' }).expect(403);
  await admin.agent.patch(`/api/feedback/${target.id}/status`).set('Origin', 'https://elsewhere.test').send({ status: 'planned' }).expect(403);
  expect((await Feedback.findById(target.id)).status).toBe('under_review');
});
