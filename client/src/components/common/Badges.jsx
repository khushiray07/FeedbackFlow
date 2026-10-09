import { statusLabels } from '../../services/feedback.js';
export function StatusBadge({ status }) { return <span className={`status-badge status-${status}`}><span className="status-dot" />{statusLabels[status] || status}</span>; }
export function CategoryChip({ category }) { return <span className={`category-chip category-${category}`}>{category}</span>; }
