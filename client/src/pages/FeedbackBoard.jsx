import { useEffect, useRef } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';
import FeedbackCard from '../components/feedback/FeedbackCard.jsx';
import SearchFilters from '../components/feedback/SearchFilters.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { EmptyState, ErrorMessage, LoadingSkeleton } from '../components/common/States.jsx';
import { useFeedback } from '../hooks/useFeedback.js';
export default function FeedbackBoard() {
  const { openSubmit, refreshKey } = useOutletContext(); const searchRef = useRef(null); const [params, setParams] = useSearchParams();
  const search = params.get('search') || ''; const category = params.get('category') || ''; const status = params.get('status') || ''; const sort = params.get('sort') || 'newest'; const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const query = new URLSearchParams({ page: String(page), limit: '10', sort });
  if (search) query.set('search', search); if (category) query.set('category', category); if (status) query.set('status', status);
  const { data, loading, error, refresh, setData } = useFeedback(`/feedback?${query}`, refreshKey);
  useEffect(() => { if (params.get('focus') === 'search') searchRef.current?.focus(); }, [params]);
  function update(key, value) { const next = new URLSearchParams(params); next.delete('focus'); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); setParams(next, { replace: key === 'search' }); }
  function onVoteChanged(id, result) { setData(current => current && ({ ...current, data: current.data.map(item => item.id === id ? { ...item, ...result } : item) })); refresh(); }
  return <><section className="board-hero"><div className="container hero-inner"><div><span className="eyebrow">COMMUNITY FEEDBACK · OPEN IDEAS</span><h1>Shape what we build next.</h1><p>Share your ideas, vote on upcoming features, and track our engineering progress on the roadmap.</p></div><div className="hero-action"><span>YOUR VOICE MATTERS</span><button className="button button-primary" onClick={openSubmit}>＋ Submit Feedback</button></div></div></section><div className="container board-content"><SearchFilters searchRef={searchRef} search={search} onSearch={value => update('search', value)} category={category} onCategory={value => update('category', value)} status={status} onStatus={value => update('status', value)} sort={sort} onSort={value => update('sort', value)} /><div className="board-heading"><h2>Community ideas</h2><span>{data?.pagination.totalItems ?? 0} requests</span></div>{error && <><ErrorMessage message={error} /><button className="button button-light retry-button" onClick={refresh}>Try again</button></>}{loading ? <div className="feedback-list"><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /></div> : !error && <><div className="feedback-list">{data?.data.length ? data.data.map(item => <FeedbackCard item={item} onVoteChanged={onVoteChanged} key={item.id} />) : <EmptyState />}</div>{data?.pagination.totalPages > 1 && <Pagination page={page} totalPages={data.pagination.totalPages} onPage={value => update('page', String(value))} />}</>}</div></>;
}
