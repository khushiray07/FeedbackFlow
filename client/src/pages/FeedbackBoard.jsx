import { useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';
import FeedbackCard from '../components/feedback/FeedbackCard.jsx';
import SearchFilters from '../components/feedback/SearchFilters.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { EmptyState } from '../components/common/States.jsx';
import { previewFeedback } from '../preview/fixtures.js';
export default function FeedbackBoard() {
  const { openSubmit } = useOutletContext();
  const searchRef = useRef(null);
  const [params] = useSearchParams();
  useEffect(() => { if (params.get('focus') === 'search') searchRef.current?.focus(); }, [params]);
  const [search, setSearch] = useState(''); const [category, setCategory] = useState(''); const [status, setStatus] = useState(params.get('status') || ''); const [sort, setSort] = useState('newest'); const [page, setPage] = useState(1);
  const matched = previewFeedback.filter(item => (!search || `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase())) && (!category || item.category === category) && (!status || item.status === status));
  const ordered = sort === 'most_voted' ? [...matched].sort((a, b) => b.voteCount - a.voteCount) : matched;
  const totalPages = Math.max(1, Math.ceil(ordered.length / 4));
  const shown = ordered.slice((page - 1) * 4, page * 4);
  const change = setter => value => { setter(value); setPage(1); };
  return <><section className="board-hero"><div className="container hero-inner"><div><span className="eyebrow">COMMUNITY FEEDBACK · OPEN IDEAS</span><h1>Shape what we build next.</h1><p>Share your ideas, vote on upcoming features, and track our engineering progress on the roadmap.</p></div><div className="hero-action"><span>YOUR VOICE MATTERS</span><button className="button button-primary" onClick={openSubmit}>＋ Submit Feedback</button></div></div></section><div className="container board-content"><SearchFilters searchRef={searchRef} search={search} onSearch={change(setSearch)} category={category} onCategory={change(setCategory)} status={status} onStatus={change(setStatus)} sort={sort} onSort={change(setSort)} /><div className="board-heading"><h2>Community ideas</h2><span>{matched.length} preview requests</span></div><div className="feedback-list">{shown.length ? shown.map(item => <FeedbackCard item={item} key={item.id} />) : <EmptyState />}</div><Pagination page={page} totalPages={totalPages} onPage={setPage} /><p className="preview-note">Preview content only. Live feedback and voting connect in M8.</p></div></>;
}
