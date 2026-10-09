import { useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router';
import StatsCards from '../components/admin/StatsCards.jsx';
import { CategoryChip, StatusBadge } from '../components/common/Badges.jsx';
import { EmptyState, ErrorMessage, LoadingSkeleton } from '../components/common/States.jsx';
import Pagination from '../components/common/Pagination.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFeedback } from '../hooks/useFeedback.js';
import { displayDate, statusLabels } from '../services/feedback.js';
import { adminFeedbackPath, adminStatsPath, statusCounts, updateFeedbackStatus } from '../services/management.js';
export default function AdminDashboard() {
  const { refreshKey } = useOutletContext(); const { clearSession } = useAuth(); const [params, setParams] = useSearchParams();
  const search = params.get('search') || ''; const status = params.get('status') || ''; const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const stats = useFeedback(adminStatsPath, refreshKey); const feedback = useFeedback(adminFeedbackPath({ page, search, status }), refreshKey);
  useEffect(() => { if (stats.errorStatus === 401 || feedback.errorStatus === 401) clearSession(); }, [stats.errorStatus, feedback.errorStatus, clearSession]);
  const [updatingId, setUpdatingId] = useState(null); const [updateError, setUpdateError] = useState(''); const [updated, setUpdated] = useState(''); const [accessDenied, setAccessDenied] = useState(false);
  function updateQuery(key, value) { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); setParams(next, { replace: key === 'search' }); }
  async function changeStatus(item, nextStatus) {
    if (nextStatus === item.status || updatingId) return;
    setUpdatingId(item.id); setUpdateError(''); setUpdated('');
    try {
      const result = await updateFeedbackStatus(item.id, nextStatus);
      feedback.setData(current => current && ({ ...current, data: current.data.map(row => row.id === item.id ? result.data : row) }));
      setUpdated(`Status updated for “${item.title}”.`);
      stats.refresh(); feedback.refresh();
    } catch (error) {
      if (error.status === 401) clearSession();
      if (error.status === 403) setAccessDenied(true);
      setUpdateError(error.message);
    } finally { setUpdatingId(null); }
  }
  if (accessDenied || stats.errorStatus === 403 || feedback.errorStatus === 403) return <div className="container admin-page"><ErrorMessage message="Administrator access is required." /><Link to="/">Back to feedback board</Link></div>;
  const values = stats.data && statusCounts(stats.data);
  const statItems = stats.data && [
    { label: 'Total Feedback Requests', value: stats.data.totalFeedback, note: 'All requests' },
    { label: 'Total Votes Cast', value: stats.data.totalVotes, note: 'Persisted votes' },
    { label: 'Under Review', value: values.under_review, note: 'Awaiting triage' },
    { label: 'Planned', value: values.planned, note: 'Upcoming work' },
    { label: 'In Progress', value: values.in_progress, note: 'Being built' },
    { label: 'Completed', value: values.completed, note: 'Released' },
  ];
  return <div className="container admin-page"><span className="eyebrow">OPERATIONS · TRIAGE</span><h1>Feedback Administration &amp; Triage</h1><p className="muted">Monitor user demand, triage incoming requests, and update roadmap development statuses.</p>{updateError && <ErrorMessage message={updateError} />}{updated && <div className="success-message" role="status">{updated}</div>}{stats.error && <><ErrorMessage message={stats.error} /><button className="button button-light retry-button" onClick={stats.refresh}>Retry statistics</button></>}{stats.loading ? <div className="stats-grid"><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /></div> : !stats.error && statItems && <><StatsCards items={statItems} /><section className="distribution"><h2>Roadmap Distribution</h2><div className="distribution-bar" aria-label="Feedback status distribution">{Object.entries(values).map(([key, count]) => <span key={key} style={{ flex: count ? `${count} 1 0%` : '0 1 0%' }} title={`${statusLabels[key]}: ${count}`} />)}</div>{stats.data.totalFeedback === 0 && <p className="muted">No feedback has been submitted yet.</p>}<div className="distribution-labels">{Object.entries(values).map(([key, count]) => <span key={key}>● {statusLabels[key]}: {count}</span>)}</div></section></>}<section className="admin-table-wrap"><div className="table-heading"><h2>Feedback and status</h2><span>{feedback.data?.pagination.totalItems ?? 0} requests</span></div><div className="admin-toolbar"><label className="search-field"><span className="sr-only">Search feedback title or description</span><span aria-hidden="true">⌕</span><input type="search" maxLength={100} value={search} onChange={event => updateQuery('search', event.target.value)} placeholder="Search feedback..." /></label><label className="select-label">Status <select value={status} onChange={event => updateQuery('status', event.target.value)}><option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>{feedback.error && <div className="admin-table-error"><ErrorMessage message={feedback.error} /><button className="button button-light retry-button" onClick={feedback.refresh}>Retry feedback</button></div>}{feedback.loading ? <LoadingSkeleton lines={5} /> : !feedback.error && (feedback.data?.data.length ? <><div className="table-scroll"><table><thead><tr><th>Feedback title &amp; snippet</th><th>Category</th><th>Author &amp; date</th><th>Votes</th><th>Current status</th><th>Details</th></tr></thead><tbody>{feedback.data.data.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.description}</small></td><td><CategoryChip category={item.category} /></td><td>{item.author.name}<small>{displayDate(item.createdAt)}</small></td><td>{item.voteCount}</td><td><label className="sr-only" htmlFor={`status-${item.id}`}>Status for {item.title}</label><select id={`status-${item.id}`} className="status-select" value={item.status} disabled={updatingId !== null} onChange={event => changeStatus(item, event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{updatingId === item.id && <small role="status">Saving…</small>}</td><td><Link to={`/feedback/${item.id}`}>View</Link></td></tr>)}</tbody></table></div>{feedback.data.pagination.totalPages > 1 && <Pagination page={page} totalPages={feedback.data.pagination.totalPages} onPage={value => updateQuery('page', String(value))} />}</> : <EmptyState title="No feedback found" message="Try another search or status filter." />)}</section></div>;
}
