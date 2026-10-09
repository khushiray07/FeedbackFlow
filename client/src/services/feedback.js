export const categories = ['feature', 'improvement', 'bug', 'integration'];
export const statusLabels = { under_review: 'Under Review', planned: 'Planned', in_progress: 'In Progress', completed: 'Completed' };
export function displayDate(value) { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
