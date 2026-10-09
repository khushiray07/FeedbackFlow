import { Link } from 'react-router';
import { CategoryChip, StatusBadge } from '../common/Badges.jsx';

export function VoteButton({ count, compact = false }) { return <div className={`vote-count ${compact ? 'compact' : ''}`} aria-label={`${count} votes`}><span aria-hidden="true">⌃</span><strong>{count}</strong></div>; }
export default function FeedbackCard({ item }) {
  return <article className="feedback-card"><VoteButton count={item.voteCount} /><div className="feedback-card-main"><div className="card-tags"><StatusBadge status={item.status} /><CategoryChip category={item.category} /></div><h2><Link to={`/feedback/${item.id}`}>{item.title}</Link></h2><p>{item.description}</p><div className="card-meta"><span className="avatar">{item.author[0]}</span><span><strong>{item.author}</strong> · {item.date}</span></div></div></article>;
}
