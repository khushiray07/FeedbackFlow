import { STATUSES } from '../models/constants.js';
import { listFeedback } from '../services/feedbackService.js';

const limitPerStatus = 10;

export async function roadmap(req, res) {
  const entries = await Promise.all(STATUSES.map(async status => {
    const result = await listFeedback({ page: 1, limit: limitPerStatus, status, sort: 'most_voted' }, req.user?._id);
    return [status, { items: result.data, totalItems: result.pagination.totalItems }];
  }));
  res.json({ groups: Object.fromEntries(entries), limitPerStatus });
}
