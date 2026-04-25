import { useCallback, useState } from 'react';
import { fetchHealth as fetchHealthAPI } from '../services/api';

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [healthStatus, setHealthStatus] = useState('Awaiting ping');
  const [responseTimeMs, setResponseTimeMs] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshHealth = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const start = performance.now();
    try {
      const data = await fetchHealthAPI();
      const elapsed = Math.round(performance.now() - start);

      setHealth(data);
      setResponseTimeMs(elapsed);
      setLastCheckedAt(new Date().toISOString());
      setHealthStatus(data?.status === 'healthy' ? 'API healthy' : 'Models not ready');
    } catch (healthError) {
      setHealth(null);
      setResponseTimeMs(null);
      setHealthStatus('API offline');
      setError(healthError?.message || 'Health check failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    health,
    healthStatus,
    responseTimeMs,
    lastCheckedAt,
    isLoading,
    error,
    refreshHealth,
  };
}
