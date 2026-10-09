import { api } from './api.js';
export const roadmapPath = '/roadmap';
export const adminStatsPath = '/admin/stats';
export function roadmapStatusBoardPath(status) {
  return `/?${new URLSearchParams({ status })}`;
}
export function adminFeedbackPath({ page = 1, search = '', status = '' } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: '10', sort: 'newest' });
  if (search) query.set('search', search);
  if (status) query.set('status', status);
  return `/feedback?${query}`;
}
export function updateFeedbackStatus(id, status) {
  return api(`/feedback/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
}
export function statusCounts(stats) {
  return { under_review: stats.underReview, planned: stats.planned, in_progress: stats.inProgress, completed: stats.completed };
}
export function adminAccessState({ loading, user, sessionError }) {
  if (loading) return 'loading';
  if (!user) return sessionError ? 'session_error' : 'unauthenticated';
  return user.role === 'admin' ? 'allowed' : 'forbidden';
}
