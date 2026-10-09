import { Link } from 'react-router';
import { EmptyState } from '../components/common/States.jsx';
export default function NotFound() { return <div className="container not-found"><EmptyState title="Page not found" message="The page you requested does not exist." /><Link to="/">Back to feedback board</Link></div>; }
