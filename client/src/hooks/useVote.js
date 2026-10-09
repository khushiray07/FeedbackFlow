import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
export function useVote(item, onChanged) {
  const { user, clearSession } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  async function toggle() {
    if (!user) { navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`); return; }
    if (pending) return;
    setPending(true); setError('');
    try {
      const result = await api(`/feedback/${item.id}/vote`, { method: item.hasVoted ? 'DELETE' : 'PUT' });
      onChanged(result);
    } catch (problem) {
      if (problem.status === 401) { clearSession(); navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`); }
      else setError(problem.message);
    } finally { setPending(false); }
  }
  return { toggle, pending, error };
}
