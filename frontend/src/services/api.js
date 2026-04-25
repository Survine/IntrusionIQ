const API_BASE_URL = 'http://localhost:8000/api/v1';

async function parseError(response, fallbackMessage) {
  let detail = fallbackMessage;

  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string' && payload.detail.trim()) {
      detail = payload.detail;
    }
  } catch {
    // Ignore JSON parse failures and keep fallback message.
  }

  const error = new Error(detail);
  error.status = response.status;
  return error;
}

export async function fetchMetrics() {
  const response = await fetch(`${API_BASE_URL}/metrics`);
  if (!response.ok) {
    throw await parseError(response, 'Metrics request failed.');
  }

  return await response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw await parseError(response, 'Health request failed.');
  }

  return await response.json();
}

export async function predictFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseError(response, 'Prediction request failed.');
  }

  return await response.json();
}
