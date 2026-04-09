# External Integrations

## APIs & Services

### No External API Integrations (Yet)
The application currently runs as a **self-contained inference server** with no external API calls. All ML models are loaded from local files at startup.

### Sentry (Installed, Not Configured)
- `sentry-sdk 2.57.0` is in `backend/requirements.txt`
- **No Sentry initialization found** in `backend/app/main.py` or any other file
- Status: Dependency installed but not wired up

## Databases

### No Database
- The application has **no database layer**
- Models and artifacts are loaded from the filesystem
- No ORM, no migrations, no connection pooling
- All state is transient (in-memory during server lifetime)

## Authentication & Authorization

### None Implemented
- No auth middleware on any route
- No API key validation
- No JWT or session management
- CORS allows `http://localhost:3000` only

## Internal Services

### Frontend → Backend Communication
- Frontend expected to call backend at `http://localhost:8000` (inferred from CORS config)
- API prefix: `/api/v1`
- Endpoints:
  - `GET /api/v1/health` — Health check
  - `GET /api/v1/metrics` — Model performance metrics
  - `POST /api/v1/predict` — CSV file upload for intrusion detection

### ML Model Files (Local Filesystem)
Models are loaded from `backend/models/` and `backend/artifacts/` at server startup via `load_models()` in `backend/app/core/ml_loader.py`.

**Stage 1 — Binary Ensemble:**
| File | Format | Size | Purpose |
|------|--------|------|---------|
| `models/rf_model.pkl` | joblib/pickle | ~133B (LFS pointer) | Random Forest binary classifier |
| `models/xgb_model.pkl` | joblib/pickle | ~132B (LFS pointer) | XGBoost binary classifier |
| `models/mlp_model.keras` | Keras HDF5 | ~762KB | MLP neural network binary classifier |

**Stage 2 — Multi-class:**
| File | Format | Size | Purpose |
|------|--------|------|---------|
| `models/multiclass_xgb.pkl` | joblib/pickle | ~132B (LFS pointer) | XGBoost 15-class attack classifier |

**Shared Artifacts:**
| File | Format | Purpose |
|------|--------|---------|
| `artifacts/scaler.pkl` | joblib/pickle | StandardScaler for feature normalization |
| `artifacts/feature_names.json` | JSON | List of 66 required feature column names |
| `artifacts/label_mapping.json` | JSON | Map of class index → attack type label |

### Git LFS
- `.gitattributes` configured for large file tracking
- Model `.pkl` and `.keras` files are tracked via Git LFS
- Most model files in `backend/models/` are LFS pointers (~132 bytes)

## Webhooks & Event Triggers

### None
- No webhook endpoints
- No event-driven architecture
- No message queues or pub/sub

## Monitoring & Observability

### Structured Logging
- **structlog 25.5.0** used across all backend modules
- Logger initialized per module: `logger = structlog.get_logger()`
- Key log events: model loading, CSV receipt, prediction results, health checks

### No Metrics Collection
- No Prometheus, Datadog, or StatsD integration
- Model metrics are static (hardcoded from Kaggle training results in `backend/app/api/v1/routes/metrics.py`)
