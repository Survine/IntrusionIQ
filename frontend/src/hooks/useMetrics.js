import { useEffect, useState } from 'react';
import { fetchMetrics as fetchMetricsAPI } from '../services/api';

export function useMetrics() {
  const [metrics, setMetrics] = useState({});
  const [apiStatus, setApiStatus] = useState('API polling');

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await fetchMetricsAPI();
        setMetrics(data);
        setApiStatus('API healthy');
      } catch (error) {
        setApiStatus('API offline');
      }
    }

    void loadMetrics();
  }, []);

  return { metrics, apiStatus };
}
