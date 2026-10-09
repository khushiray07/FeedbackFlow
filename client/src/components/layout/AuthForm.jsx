import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { safeReturnPath } from '../../services/api.js';
import { ErrorMessage } from '../common/States.jsx';
export default function AuthForm({ register = false }) {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate(); const [params] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const returnTo = safeReturnPath(params.get('returnTo'));
  const otherPath = `${register ? '/login' : '/register'}?returnTo=${encodeURIComponent(returnTo)}${params.get('action') === 'submit' ? '&action=submit' : ''}`;
  async function submit(event) {
    event.preventDefault(); setError('');
    if (register && (name.trim().length < 2 || name.trim().length > 80)) { setError('Name must be 2–80 characters.'); return; }
    if (register && (password.length < 8 || !/\d/.test(password) || new TextEncoder().encode(password).length > 72)) { setError('Password needs at least 8 characters and a number, and must be at most 72 bytes.'); return; }
    if (register && password !== confirm) { setError('Passwords do not match.'); return; }
    setPending(true);
    try {
      if (register) await registerUser({ name: name.trim(), email: email.trim(), password });
      else await login({ email: email.trim(), password });
      const destination = params.get('action') === 'submit' ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}submit=1` : returnTo;
      navigate(destination, { replace: true });
    } catch (problem) { setError(problem.message); } finally { setPending(false); }
  }
  return <div className="auth-form-wrap"><div className="auth-switch">{register ? 'Already have an account?' : 'New to FeedbackFlow?'} <Link to={otherPath}>{register ? 'Log in' : 'Create account'}</Link></div><div className="auth-form-body"><h2>{register ? 'Create your account' : 'Welcome back'}</h2><p className="muted">{register ? 'Get started with FeedbackFlow in less than 2 minutes.' : 'Enter your credentials to access your FeedbackFlow account.'}</p><form onSubmit={submit}>{register && <><label className="field-label" htmlFor="auth-name">Full name</label><input id="auth-name" type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={80} placeholder="Jane Doe" /></>}<label className="field-label" htmlFor="auth-email">Email address</label><input id="auth-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="you@company.com" /><label className="field-label" htmlFor="auth-password">Password</label><div className="password-wrap"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div>{register && <><label className="field-label" htmlFor="auth-confirm">Confirm password</label><input id="auth-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} required placeholder="Re-enter your password" /></>}{error && <ErrorMessage message={error} />}<button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? 'Please wait…' : register ? 'Create Account' : 'Sign In'} →</button></form></div><Link className="auth-back" to="/">← Back to feedback board</Link></div>;
}
