import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { expect, it } from 'vitest';
import app from '../app.js';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';

const origin = 'http://localhost:5173';
async function account() {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/register').set('Origin', origin).send({
    name: 'Voting User', email: `${randomUUID()}@example.test`, password: 'Valid-password-42',
  }).expect(201);
  return { agent, id: response.body.user.id };
}
async function feedback(author) {
  return Feedback.create({ title: `Vote target ${randomUUID()}`, description: 'A sufficiently detailed feedback description.', category: 'integration', author });
}
const vote = (agent, id) => agent.put(`/api/feedback/${id}/vote`).set('Origin', origin);
const unvote = (agent, id) => agent.delete(`/api/feedback/${id}/vote`).set('Origin', origin);

it('requires a session and valid origin for both vote methods', async () => {
  const { agent, id } = await account();
  const item = await feedback(id);
  for (const method of ['put', 'delete']) {
    await request(app)[method](`/api/feedback/${item.id}/vote`).set('Origin', origin).expect(401);
    await agent[method](`/api/feedback/${item.id}/vote`).expect(403);
    await agent[method](`/api/feedback/${item.id}/vote`).set('Origin', 'https://elsewhere.test').expect(403);
  }
  expect(await Vote.countDocuments({ feedback: item.id })).toBe(0);
});

it('rejects malformed and nonexistent feedback IDs without creating votes', async () => {
  const { agent, id } = await account();
  for (const method of ['put', 'delete']) {
    expect((await agent[method]('/api/feedback/invalid/vote').set('Origin', origin).expect(400)).body.error.code).toBe('INVALID_ID');
    expect((await agent[method](`/api/feedback/${new mongoose.Types.ObjectId()}/vote`).set('Origin', origin).expect(404)).body.error.code).toBe('NOT_FOUND');
  }
  expect(await Vote.countDocuments({ user: id })).toBe(0);
});

it('adds and removes votes idempotently and refreshes detail and list results', async () => {
  const { agent, id } = await account();
  const item = await feedback(id);
  for (let attempt = 0; attempt < 2; attempt++) {
    expect((await vote(agent, item.id).expect(200)).body).toEqual({ hasVoted: true, voteCount: 1 });
  }
  expect(await Vote.countDocuments({ user: id, feedback: item.id })).toBe(1);
  expect((await agent.get(`/api/feedback/${item.id}`).expect(200)).body.data).toMatchObject({ voteCount: 1, hasVoted: true });
  expect((await agent.get('/api/feedback').query({ search: item.title }).expect(200)).body.data[0]).toMatchObject({ voteCount: 1, hasVoted: true });
  expect((await request(app).get(`/api/feedback/${item.id}`).expect(200)).body.data).toMatchObject({ voteCount: 1, hasVoted: false });
  for (let attempt = 0; attempt < 2; attempt++) {
    expect((await unvote(agent, item.id).expect(200)).body).toEqual({ hasVoted: false, voteCount: 0 });
  }
  expect((await agent.get(`/api/feedback/${item.id}`).expect(200)).body.data).toMatchObject({ voteCount: 0, hasVoted: false });
});

it('handles concurrent votes through the compound unique index', async () => {
  const { agent, id } = await account();
  const item = await feedback(id);
  const responses = await Promise.all(Array.from({ length: 8 }, () => vote(agent, item.id)));
  expect(responses.every(response => response.status === 200)).toBe(true);
  expect(responses.every(response => response.body.voteCount === 1 && response.body.hasVoted)).toBe(true);
  expect(await Vote.countDocuments({ user: id, feedback: item.id })).toBe(1);
  await expect(Vote.create({ user: id, feedback: item.id })).rejects.toMatchObject({ code: 11000 });
});

it('keeps users independent and reorders most-voted results after voting', async () => {
  const first = await account();
  const second = await account();
  const older = await feedback(first.id);
  const newer = await feedback(first.id);
  await vote(first.agent, older.id).expect(200);
  expect((await vote(second.agent, older.id).expect(200)).body).toEqual({ hasVoted: true, voteCount: 2 });
  const ranked = await request(app).get('/api/feedback').query({ category: 'integration', sort: 'most_voted' }).expect(200);
  expect(ranked.body.data[0]).toMatchObject({ id: older.id, voteCount: 2, hasVoted: false });
  expect(ranked.body.data.find(item => item.id === newer.id).voteCount).toBe(0);
  expect((await unvote(first.agent, older.id).expect(200)).body).toEqual({ hasVoted: false, voteCount: 1 });
  expect((await second.agent.get(`/api/feedback/${older.id}`).expect(200)).body.data).toMatchObject({ voteCount: 1, hasVoted: true });
  expect((await first.agent.get(`/api/feedback/${older.id}`).expect(200)).body.data).toMatchObject({ voteCount: 1, hasVoted: false });
});
