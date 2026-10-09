import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
export function useFeedback(path, refreshKey = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setErrorStatus(null);
    api(path, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) setData(result); }).catch(problem => { if (!controller.signal.aborted && problem.name !== 'AbortError') { setError(problem.message); setErrorStatus(problem.status ?? null); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, refreshKey, version]);
  return { data, loading, error, errorStatus, refresh, setData };
}
