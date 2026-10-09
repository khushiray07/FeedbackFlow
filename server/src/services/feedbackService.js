import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import Vote from '../models/Vote.js';

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const authorLookup = [
  { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author', pipeline: [{ $project: { name: 1 } }] } },
  { $unwind: '$author' },
];
const voteLookup = [
  { $lookup: { from: 'votes', let: { feedbackId: '$_id' }, pipeline: [
    { $match: { $expr: { $eq: ['$feedback', '$$feedbackId'] } } },
    { $count: 'count' },
  ], as: 'votes' } },
  { $set: { voteCount: { $ifNull: [{ $first: '$votes.count' }, 0] } } },
  { $unset: 'votes' },
];

function responseItem(item, votedIds) {
  return {
    id: String(item._id), title: item.title, description: item.description,
    category: item.category, status: item.status,
    author: { id: String(item.author._id), name: item.author.name },
    voteCount: item.voteCount || 0, hasVoted: votedIds.has(String(item._id)),
    createdAt: item.createdAt, updatedAt: item.updatedAt,
  };
}

async function formatItems(items, userId) {
  const votedIds = new Set();
  if (userId && items.length) {
    const votes = await Vote.find({ user: userId, feedback: { $in: items.map(item => item._id) } }).select('feedback').lean();
    for (const vote of votes) votedIds.add(String(vote.feedback));
  }
  return items.map(item => responseItem(item, votedIds));
}

export async function getFeedback(id, userId) {
  const [item] = await Feedback.aggregate([{ $match: { _id: new mongoose.Types.ObjectId(id) } }, ...authorLookup, ...voteLookup]);
  if (!item) return null;
  return (await formatItems([item], userId))[0];
}

export async function listFeedback({ page, limit, search, category, status, sort }, userId) {
  const match = {};
  if (category) match.category = category;
  if (status) match.status = status;
  if (search) {
    const expression = new RegExp(escapeRegex(search), 'i');
    match.$or = [{ title: expression }, { description: expression }];
  }
  const totalItems = await Feedback.countDocuments(match);
  const skip = (page - 1) * limit;
  let items;
  if (sort === 'most_voted') {
    items = await Feedback.aggregate([
      { $match: match }, ...voteLookup,
      { $sort: { voteCount: -1, createdAt: -1, _id: -1 } },
      { $skip: skip }, { $limit: limit }, ...authorLookup,
    ]);
  } else {
    items = await Feedback.aggregate([
      { $match: match }, { $sort: { createdAt: -1, _id: -1 } },
      { $skip: skip }, { $limit: limit }, ...authorLookup, ...voteLookup,
    ]);
  }
  return {
    data: await formatItems(items, userId),
    pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
  };
}
