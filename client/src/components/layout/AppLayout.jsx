import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import Modal from '../common/Modal.jsx';
import FeedbackForm from '../feedback/FeedbackForm.jsx';
import { ErrorMessage } from '../common/States.jsx';
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false); const [modalOpen, setModalOpen] = useState(false); const [refreshKey, setRefreshKey] = useState(0); const [notice, setNotice] = useState(''); const [logoutError, setLogoutError] = useState('');
  const { user, loading, sessionError, logout } = useAuth(); const navigate = useNavigate(); const location = useLocation(); const [params, setParams] = useSearchParams();
  const links = [['/', 'Feedback Board'], ['/roadmap', 'Public Roadmap']];
  function openSubmit() {
    if (!user) { navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}&action=submit`); return; }
    setModalOpen(true);
  }
  useEffect(() => {
    if (loading || params.get('submit') !== '1') return;
    if (user) setModalOpen(true);
    const next = new URLSearchParams(params); next.delete('submit'); setParams(next, { replace: true });
  }, [loading, user, params, setParams]);
  async function signOut() { setLogoutError(''); try { await logout(); setModalOpen(false); setRefreshKey(value => value + 1); navigate('/'); } catch (error) { setLogoutError(error.message); } }
  function created(item) { setModalOpen(false); setNotice('Feedback submitted and marked Under Review.'); setRefreshKey(value => value + 1); navigate(`/feedback/${item.id}`); }
  return <><div id="app-shell"><header className="site-header"><div className="header-inner"><Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">ϟ</span>FeedbackFlow</Link><nav className="desktop-nav" aria-label="Main navigation">{links.map(([to, label]) => <NavLink end key={to} to={to}>{label}</NavLink>)}{user?.role === 'admin' && <NavLink to="/admin">Admin Dashboard</NavLink>}</nav><div className="header-actions"><button className="header-search" type="button" onClick={() => navigate('/?focus=search')}>⌕ <span>Search feedback...</span></button><button className="button button-primary submit-top" type="button" onClick={openSubmit}>＋ <span>Submit Feedback</span></button>{loading ? <span className="session-label">Checking session…</span> : user ? <><span className="session-label">{user.name}</span><button className="login-link link-button" onClick={signOut}>Log out</button></> : <Link className="login-link" to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}>Log in</Link>}<button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(value => !value)}>☰</button></div></div><nav id="mobile-menu" className={`mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile navigation">{links.map(([to, label]) => <NavLink end key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}{user?.role === 'admin' && <NavLink to="/admin" onClick={() => setMenuOpen(false)}>Admin Dashboard</NavLink>}{user ? <button onClick={() => { setMenuOpen(false); signOut(); }}>Log out</button> : <NavLink to="/login" onClick={() => setMenuOpen(false)}>Log in</NavLink>}</nav></header>{sessionError && <div className="container"><ErrorMessage message={`Session check failed: ${sessionError} Public feedback remains available.`} /></div>}{logoutError && <div className="container"><ErrorMessage message={logoutError} /></div>}{notice && <div className="container success-message" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div>}<main className="site-main"><Outlet context={{ openSubmit, refreshKey }} /></main><footer className="site-footer"><div className="container footer-inner"><Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">ϟ</span>FeedbackFlow</Link><span>Product feedback and feature voting.</span></div></footer></div>{modalOpen && <Modal title="Submit New Feedback" onClose={() => setModalOpen(false)}><FeedbackForm onClose={() => setModalOpen(false)} onCreated={created} /></Modal>}</>;
}
