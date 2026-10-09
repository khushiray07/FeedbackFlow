import { useState } from 'react';
import { useOutletContext } from 'react-router';
import RoadmapLane from '../components/roadmap/RoadmapLane.jsx';
import { ErrorMessage, LoadingSkeleton } from '../components/common/States.jsx';
import { statusLabels } from '../services/feedback.js';
import { roadmapPath } from '../services/management.js';
import { useFeedback } from '../hooks/useFeedback.js';
export default function Roadmap() {
  const { openSubmit, refreshKey } = useOutletContext(); const [active, setActive] = useState('under_review');
  const { data, loading, error, refresh } = useFeedback(roadmapPath, refreshKey);
  return <div className="container roadmap-page"><div className="roadmap-intro"><div><span className="eyebrow">PRODUCT ROADMAP · COMMUNITY VOTED</span><h1>Public Product Roadmap</h1><p>Track what the team is researching, planning, building, and shipping on the public roadmap.</p></div><button className="button button-dark" onClick={openSubmit}>＋ Propose an idea</button></div>{error && <><ErrorMessage message={error} /><button className="button button-light retry-button" onClick={refresh}>Try again</button></>}{loading ? <div className="roadmap-grid"><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /><LoadingSkeleton /></div> : !error && data && <><div className="roadmap-tabs" role="group" aria-label="Roadmap status">{Object.entries(statusLabels).map(([key, label]) => <button type="button" aria-pressed={active === key} key={key} onClick={() => setActive(key)}>{label}</button>)}</div><div className="roadmap-grid">{Object.keys(statusLabels).map(status => <div key={status} className={active === status ? 'lane-active' : ''}><RoadmapLane status={status} group={data.groups[status]} limitPerStatus={data.limitPerStatus} /></div>)}</div></>}</div>;
}
