import { Link, Navigate, Outlet, useLocation, useOutletContext } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminAccessState } from '../../services/management.js';
import { LoadingSkeleton, ErrorMessage } from '../common/States.jsx';
export default function RequireAdmin() {
  const { user, loading, sessionError } = useAuth(); const location = useLocation();
  const layoutContext = useOutletContext();
  const access = adminAccessState({ user, loading, sessionError });
  if (access === 'loading') return <div className="container admin-page"><LoadingSkeleton /></div>;
  if (access === 'unauthenticated' || access === 'session_error') {
    if (sessionError) return <div className="container admin-page"><ErrorMessage message={sessionError} /><Link to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}>Log in to retry</Link></div>;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (access === 'forbidden') return <div className="container admin-page"><ErrorMessage message="Administrator access is required." /><p><Link to="/">Back to feedback board</Link></p></div>;
  return <Outlet context={layoutContext} />;
}
