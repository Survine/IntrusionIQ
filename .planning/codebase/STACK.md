# Technology Stack

## Languages

| Language | Version | Usage |
|----------|---------|-------|
| Python | 3.x (inferred from dependencies) | Backend API, ML inference, data processing |
| JavaScript (JSX) | ES6+ | Frontend UI (React) |

## Runtime & Frameworks

### Backend
- **FastAPI 0.135.3** — Async Python REST API framework
  - Entry point: `backend/app/main.py`
  - Lifespan-based startup (model preloading)
  - Auto-generated docs at `/docs` (Swagger) and `/redoc`
- **Uvicorn 0.42.0** — ASGI server
- **Pydantic 2.12.5** / **pydantic-settings 2.13.1** — Request/response validation and typed config
- **Starlette 1.0.0** — Underlying ASGI toolkit (via FastAPI)

### Frontend
- **React** (JSX) — Component-based UI
  - Entry: `frontend/src/App.jsx`
  - Empty `package.json` — framework scaffolding not yet configured
  - Component stubs with `.gitkeep` placeholders

### ML / Data Science
- **scikit-learn 1.8.0** — Random Forest, Standard Scaler, model utilities
- **XGBoost 3.2.0** — Gradient boosting (binary + multi-class classifiers)
- **Keras 3.13.2** — MLP neural network (`.keras` format)
- **NumPy 2.4.4** — Numerical operations
- **Pandas 3.0.2** — CSV parsing and DataFrame manipulation
- **joblib 1.5.3** — Model serialization/deserialization (`.pkl` files)
- **h5py 3.16.0** — HDF5 support (Keras model weight storage)

## Dependencies (Key Packages)

### Production Dependencies (`backend/requirements.txt`)

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.135.3 | REST API framework |
| uvicorn | 0.42.0 | ASGI server |
| pydantic | 2.12.5 | Data validation |
| pydantic-settings | 2.13.1 | Typed settings from `.env` |
| structlog | 25.5.0 | Structured logging |
| scikit-learn | 1.8.0 | ML: RF model, scaler |
| xgboost | 3.2.0 | ML: XGBoost classifiers |
| keras | 3.13.2 | ML: MLP neural network |
| numpy | 2.4.4 | Numerical operations |
| pandas | 3.0.2 | CSV/DataFrame processing |
| joblib | 1.5.3 | Model serialization |
| python-dotenv | 1.2.2 | Environment variable loading |
| sentry-sdk | 2.57.0 | Error monitoring (installed, not configured in code) |
| httpx | 0.28.1 | Async HTTP client |

### Dev / CLI Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| fastapi-cli | 0.0.24 | FastAPI CLI tools |
| rich | 14.3.3 | Terminal formatting |
| typer | 0.24.1 | CLI framework |

## Configuration

### Environment Variables (`backend/.env`)
```
APP_NAME=IntrusionIQ
APP_VERSION=1.0.0
DEBUG=True
RF_MODEL_PATH=models/rf_model.pkl
XGB_MODEL_PATH=models/xgb_model.pkl
MLP_MODEL_PATH=models/mlp_model.keras
MULTICLASS_MODEL_PATH=models/multiclass_xgb.pkl
SCALER_PATH=artifacts/scaler.pkl
FEATURES_PATH=artifacts/feature_names.json
LABEL_MAPPING_PATH=artifacts/label_mapping.json
API_V1_PREFIX=/api/v1
TF_ENABLE_ONEDNN_OPTS=0
```

### Settings Management
- **Pydantic Settings** via `backend/app/core/config.py`
- Loads from `.env` file with `SettingsConfigDict(env_file=".env")`
- Case-sensitive keys, extra fields ignored
- Singleton pattern: `settings = Settings()`

## Build & Deployment

### Docker
- `backend/Dockerfile` — Empty (not yet implemented)
- `frontend/Dockerfile` — Empty (not yet implemented)
- `docker-compose.yml` — Empty (not yet implemented)

### Package Management
- **Backend**: `pip` with `requirements.txt` (pinned versions)
- **Frontend**: `npm` (package.json exists but empty)
- **Python venv**: `backend/.venv/` (gitignored)

## Dataset
- **CICIDS2017** — Canadian Institute for Cybersecurity Intrusion Detection dataset
- 66 network flow features (packet lengths, IAT, flags, etc.)
- 15 attack classes + BENIGN
- Demo sample: `ml/demo_sample.csv` (365 KB)
