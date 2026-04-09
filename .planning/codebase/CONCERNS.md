# Concerns

## Technical Debt

### 1. Frontend Not Implemented
- **Severity: High**
- All frontend files are empty placeholders (0 bytes each)
- `frontend/package.json` — empty, no dependencies defined
- `frontend/src/App.jsx` — empty
- `frontend/src/pages/Dashboard.jsx` — empty
- `frontend/src/services/api.js` — empty
- Component directories contain only `.gitkeep` files
- **Impact:** No user-facing interface exists; the system can only be used via API calls or tools like Postman

### 2. Docker Configuration Missing
- **Severity: Medium**
- `backend/Dockerfile` — empty (0 bytes)
- `frontend/Dockerfile` — empty (0 bytes)
- `docker-compose.yml` — empty (0 bytes)
- **Impact:** No containerized deployment path; must run manually with `uvicorn`

### 3. No Test Coverage
- **Severity: High**
- `backend/tests/test_predict.py` is empty
- No test framework (pytest) in dependencies
- No CI/CD pipeline to enforce testing
- **Impact:** Regressions can ship silently; no safety net for refactoring

### 4. Empty README
- **Severity: Low**
- `README.md` is empty (0 bytes)
- No setup instructions, API docs, or project overview
- **Impact:** Onboarding difficulty for new contributors

### 5. Duplicate Model Files
- **Severity: Low**
- Models exist in both `ml/models/` (training source) and `backend/models/` (runtime)
- `ml/artifacts/` and `backend/artifacts/` contain identical files 
- No automation to sync between them
- **Impact:** Risk of serving stale models if updated in one location but not the other

## Security Concerns

### 1. No Authentication
- **Severity: High**
- All API endpoints are completely open
- No API key, JWT, OAuth, or any auth mechanism
- Any client can submit CSVs for prediction
- **Impact:** Unauthorized access, potential DoS via large CSV uploads

### 2. No Input Size Limits
- **Severity: Medium**
- `POST /api/v1/predict` accepts arbitrarily large CSV files
- No max file size validation
- No rate limiting
- **Impact:** Memory exhaustion, denial of service

### 3. Detailed Error Messages in Production
- **Severity: Low-Medium**
- Exception details exposed in HTTP responses: `f"Prediction failed: {str(e)}"`
- Stack traces may leak internal paths/versions
- `DEBUG=True` in `.env` file
- **Impact:** Information disclosure to attackers

### 4. CORS Configuration
- **Severity: Low** (dev-only concern)
- CORS allows all methods and headers from `http://localhost:3000`
- Acceptable for development, but should be tightened for production
- No production CORS origin configured

### 5. `.env` File in Repository
- **Severity: Low** (no real secrets currently)
- `.env` is in `.gitignore` but `backend/.env` exists and contains only config (no API keys)
- If real secrets are added later, this pattern needs review

## Performance Concerns

### 1. Synchronous Model Inference
- **Severity: Medium**
- `predict_two_stage()` runs synchronously despite being called from an `async` route
- ML inference (especially MLP) blocks the event loop
- **Impact:** Under concurrent load, only one prediction can run at a time; other requests wait

### 2. Full CSV Loading in Memory
- **Severity: Medium**
- Entire CSV is read into a pandas DataFrame at once
- Large files (millions of rows) could exhaust server memory
- No streaming or chunked processing
- **Impact:** OOM risk with production-scale network flow data

### 3. No Model Caching/Versioning
- **Severity: Low**
- Models loaded once at startup, never refreshed
- No model versioning or A/B testing capability
- Server restart required to update models
- **Impact:** Cannot hot-swap models; any model update requires downtime

### 4. Git LFS Pointer Issue
- **Severity: Medium**
- Most `.pkl` model files in `backend/models/` are ~132 bytes (LFS pointers, not actual models)
- If Git LFS is not properly configured or `git lfs pull` was not run, models will fail to load
- **Impact:** Server crashes at startup if LFS files aren't resolved

## Fragile Areas

### 1. Model-Feature Coupling
- **Location:** `backend/app/core/ml_loader.py` + `backend/artifacts/feature_names.json`
- The API expects exactly 66 specific columns in the uploaded CSV
- Column names must match exactly (case-sensitive, whitespace-sensitive)
- Any retraining with different features breaks the API silently

### 2. Hardcoded Model Metrics
- **Location:** `backend/app/api/v1/routes/metrics.py`
- Performance metrics are hardcoded constants, not computed from models
- If models are retrained, metrics will be stale
- No way to distinguish which model version the metrics refer to

### 3. Binary Threshold
- **Location:** `backend/app/core/ml_loader.py`, line 89
- Hardcoded `>= 0.50` threshold for binary classification
- Not configurable via environment or settings
- Threshold tuning requires code changes

### 4. Label Mapping Drift
- If multi-class model is retrained with different classes, `label_mapping.json` must be updated manually
- No validation that model's output dimensions match label mapping size

## Missing Infrastructure

| What | Status |
|------|--------|
| Database | Not present |
| Authentication | Not present |
| Rate limiting | Not present |
| Input validation (file size) | Not present |
| Health check (deep) | Partial — checks model loaded, not model health |
| Monitoring/alerting | Not present |
| CI/CD pipeline | Not present |
| Logging persistence | Not present (stdout only) |
| API versioning strategy | v1 prefix exists, no v2 plan |
| Model registry | Not present |
