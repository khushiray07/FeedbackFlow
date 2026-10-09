import { Link } from 'react-router';
import { CategoryChip, StatusBadge } from '../common/Badges.jsx';
import { displayDate } from '../../services/feedback.js';
import { roadmapStatusBoardPath } from '../../services/management.js';
export default function RoadmapLane({ status, group, limitPerStatus }) {
  const { items, totalItems } = group;
  return <section className={`roadmap-lane lane-${status}`}><div className="lane-heading"><StatusBadge status={status} /><span>{totalItems} {totalItems === 1 ? 'request' : 'requests'}</span></div><p className="lane-subtitle">{status === 'under_review' ? 'Ideas being evaluated by our team' : status === 'planned' ? 'Committed to upcoming releases' : status === 'in_progress' ? 'Actively being built' : 'Released and ready to use'}</p><div className="lane-items">{items.length ? items.map(item => <article className="roadmap-card" key={item.id}><div className="card-tags"><CategoryChip category={item.category} /><StatusBadge status={item.status} /></div><h3><Link to={`/feedback/${item.id}`}>{item.title}</Link></h3><p>{item.description}</p><div className="roadmap-card-footer"><span>⌃ {item.voteCount} {item.voteCount === 1 ? 'vote' : 'votes'}</span><span>{displayDate(item.createdAt)}</span></div></article>) : <p className="lane-empty">No requests in this stage yet.</p>}</div>{totalItems > limitPerStatus && <p className="lane-truncated">Showing the top {items.length} of {totalItems} by votes</p>}<Link className="view-all" to={roadmapStatusBoardPath(status)}>View all {status.replaceAll('_', ' ')} →</Link></section>;
}
