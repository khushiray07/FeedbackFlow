import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import Modal from '../common/Modal.jsx';
import FeedbackForm from '../feedback/FeedbackForm.jsx';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const links = [['/', 'Feedback Board'], ['/roadmap', 'Public Roadmap']];
  return <><div id="app-shell"><header className="site-header"><div className="header-inner"><Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">ϟ</span>FeedbackFlow</Link><nav className="desktop-nav" aria-label="Main navigation">{links.map(([to, label]) => <NavLink end key={to} to={to}>{label}</NavLink>)}</nav><div className="header-actions"><button className="header-search" type="button" onClick={() => navigate('/?focus=search')}>⌕ <span>Search feedback...</span></button><button className="button button-primary submit-top" type="button" onClick={() => setModalOpen(true)}>＋ <span>Submit Feedback</span></button><Link className="login-link" to="/login">Log in</Link><button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(value => !value)}>☰</button></div></div><nav id="mobile-menu" className={`mobile-nav ${menuOpen ? 'open' : ''}`} aria-label="Mobile navigation">{links.map(([to, label]) => <NavLink end key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}<NavLink to="/login" onClick={() => setMenuOpen(false)}>Log in</NavLink></nav></header><main className="site-main"><Outlet context={{ openSubmit: () => setModalOpen(true) }} /></main><footer className="site-footer"><div className="container footer-inner"><Link className="brand" to="/"><span className="brand-mark" aria-hidden="true">ϟ</span>FeedbackFlow</Link><span>Product feedback and feature voting.</span></div></footer></div>{modalOpen && <Modal title="Submit New Feedback" onClose={() => setModalOpen(false)}><FeedbackForm onClose={() => setModalOpen(false)} /></Modal>}</>;
}
