import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api('/auth/me', { signal: controller.signal }).then(result => setUser(result.user)).catch(error => { if (error.name !== 'AbortError') { setUser(null); if (error.status !== 401) setSessionError(error.message); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function login(credentials) { const result = await api('/auth/login', { method: 'POST', body: credentials }); setUser(result.user); setSessionError(''); return result.user; }
  async function register(credentials) { const result = await api('/auth/register', { method: 'POST', body: credentials }); setUser(result.user); setSessionError(''); return result.user; }
  async function logout() { await api('/auth/logout', { method: 'POST' }); setUser(null); }
  function clearSession() { setUser(null); }
  return <AuthContext.Provider value={{ user, loading, sessionError, login, register, logout, clearSession }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing.'); return value; }
