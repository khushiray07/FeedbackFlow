import { Link, useOutletContext, useParams } from 'react-router';
import { CategoryChip, StatusBadge } from '../components/common/Badges.jsx';
import { VoteButton } from '../components/feedback/FeedbackCard.jsx';
import { EmptyState, ErrorMessage, LoadingSkeleton } from '../components/common/States.jsx';
import { useFeedback } from '../hooks/useFeedback.js';
import { displayDate } from '../services/feedback.js';
export default function FeedbackDetails() {
  const { id } = useParams(); const { refreshKey } = useOutletContext(); const { data, setData, loading, error, refresh } = useFeedback(`/feedback/${encodeURIComponent(id)}`, refreshKey);
  const item = data?.data;
  function onVoteChanged(result) { setData(current => ({ ...current, data: { ...current.data, ...result } })); refresh(); }
  if (loading) return <div className="container details-page"><LoadingSkeleton lines={5} /></div>;
  if (error) return <div className="container details-page">{error === 'Feedback not found.' ? <EmptyState title="Feedback not found" message="This request may no longer be available." /> : <ErrorMessage message={error} />}<button className="button button-light retry-button" onClick={refresh}>Try again</button><p><Link to="/">← Back to board</Link></p></div>;
  if (!item) return null;
  const date = displayDate(item.createdAt);
  return <div className="container details-page"><Link className="back-link" to="/">← Back to Feedback Board</Link><div className="details-grid"><article className="details-main"><div className="card-tags"><CategoryChip category={item.category} /><StatusBadge status={item.status} /></div><div className="detail-heading"><div><span className="eyebrow">FEEDBACK REQUEST · {date.toUpperCase()}</span><h1>{item.title}</h1></div><VoteButton item={item} onChanged={onVoteChanged} /></div><div className="card-meta"><span className="avatar">{item.author.name[0]}</span><span>Submitted by <strong>{item.author.name}</strong> · {date}</span></div><section className="detail-description"><h2>About this request</h2><p>{item.description}</p></section></article><aside className="details-aside"><h2>Roadmap status</h2><StatusBadge status={item.status} /><p>Track this request as it moves through our product roadmap.</p><div className="side-rule" /><h2>Item telemetry</h2><dl><div><dt>Votes</dt><dd>{item.voteCount}</dd></div><div><dt>Category</dt><dd>{item.category}</dd></div><div><dt>Submitted</dt><dd>{date}</dd></div></dl></aside></div></div>;
}
