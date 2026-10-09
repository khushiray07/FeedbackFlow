import { Link } from 'react-router';
import { CategoryChip, StatusBadge } from '../common/Badges.jsx';
import { displayDate } from '../../services/feedback.js';
import { useVote } from '../../hooks/useVote.js';
import { ErrorMessage } from '../common/States.jsx';
export function VoteButton({ item, onChanged, compact = false }) {
  const { toggle, pending, error } = useVote(item, onChanged);
  return <div className="vote-cell"><button type="button" className={`vote-count ${compact ? 'compact' : ''} ${item.hasVoted ? 'voted' : ''}`} aria-label={`${item.hasVoted ? 'Remove vote from' : 'Vote for'} ${item.title}; ${item.voteCount} votes`} aria-pressed={item.hasVoted} disabled={pending} onClick={toggle}><span aria-hidden="true">⌃</span><strong>{item.voteCount}</strong></button>{error && <ErrorMessage message={error} />}</div>;
}
export default function FeedbackCard({ item, onVoteChanged }) {
  return <article className="feedback-card"><VoteButton item={item} onChanged={result => onVoteChanged(item.id, result)} /><div className="feedback-card-main"><div className="card-tags"><StatusBadge status={item.status} /><CategoryChip category={item.category} /></div><h2><Link to={`/feedback/${item.id}`}>{item.title}</Link></h2><p>{item.description}</p><div className="card-meta"><span className="avatar">{item.author.name[0]}</span><span><strong>{item.author.name}</strong> · {displayDate(item.createdAt)}</span></div></div></article>;
}
