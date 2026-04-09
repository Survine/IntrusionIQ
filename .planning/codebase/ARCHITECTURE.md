# Architecture

## Overall Pattern

**Monorepo with 3 independent modules:**
- `backend/` — FastAPI REST API for ML inference
- `frontend/` — React dashboard (scaffolded, not implemented)
- `ml/` — Training artifacts store (models trained externally on Kaggle)

The architecture follows a **two-stage ML inference pipeline** served via a REST API:

```
CSV Upload → Feature Validation → Scaling → Stage 1 (Binary) → Stage 2 (Multi-class) → JSON Response
```

## Architectural Layers

### 1. API Layer (`backend/app/api/`)
- **Versioned REST API** with `/api/v1` prefix
- Routes organized by domain: `health.py`, `metrics.py`, `predict.py`
- FastAPI router pattern — each module exports a `router = APIRouter()`
- Routers registered in `backend/app/main.py` via `app.include_router()`

### 2. Schema Layer (`backend/app/schemas/`)
- **Pydantic v2 models** for request/response validation
- `prediction.py` — `PredictionResponse`, `BulkPredictionResponse`
- `health.py` — `HealthResponse` with Literal type
- `metrics.py` — `MetricsResponse`

### 3. Core Layer (`backend/app/core/`)
- `config.py` — Centralized settings via pydantic-settings (singleton)
- `ml_loader.py` — Model loading, inference logic, two-stage pipeline

### 4. ML Inference Layer (`backend/app/core/ml_loader.py`)
- **MLModels class** — Global singleton holding all loaded models
- **load_models()** — Called once at startup via FastAPI lifespan
- **predict_binary_ensemble()** — Stage 1: Soft voting average of RF, XGBoost, MLP probabilities
- **predict_two_stage()** — Full pipeline: binary → multi-class for detected attacks

## Data Flow

### Prediction Request Flow
```
Client (CSV upload)
  │
  ▼
POST /api/v1/predict
  │
  ├── Validate file is .csv
  ├── Parse CSV into DataFrame
  ├── Validate required 66 columns exist
  ├── Handle inf/NaN values (replace with median)
  ├── Scale features using pre-fitted StandardScaler
  │
  ├── Stage 1: Binary Ensemble
  │   ├── RF.predict_proba() → P(attack)
  │   ├── XGB.predict_proba() → P(attack)
  │   ├── MLP.predict() → P(attack)
  │   └── Average probabilities → threshold at 0.50
  │
  ├── Stage 2: Multi-class (attacks only)
  │   ├── Filter rows where Stage 1 = ATTACK
  │   ├── XGBoost multi-class.predict_proba()
  │   ├── argmax → attack type label via label_mapping
  │   └── Override to BENIGN if multi-class says BENIGN
  │
  └── Return BulkPredictionResponse
      ├── Total flows, attack/benign counts
      ├── Attack type breakdown
      └── Per-flow predictions with confidence scores
```

### Startup Flow
```
uvicorn backend/app/main.py:app
  │
  ├── FastAPI lifespan context manager
  ├── load_models() called once
  │   ├── joblib.load(rf_model.pkl)
  │   ├── joblib.load(xgb_model.pkl)
  │   ├── keras.models.load_model(mlp_model.keras)
  │   ├── joblib.load(multiclass_xgb.pkl)
  │   ├── joblib.load(scaler.pkl)
  │   ├── json.load(feature_names.json)
  │   └── json.load(label_mapping.json)
  │
  └── Server ready — models held in memory
```

## Key Abstractions

### MLModels (Singleton)
- Location: `backend/app/core/ml_loader.py`
- Pattern: Module-level singleton (`ml_models = MLModels()`)
- Not a FastAPI dependency injection — accessed via `get_models()` function
- Holds all model references as class attributes

### Settings (Singleton)
- Location: `backend/app/core/config.py`
- Pattern: Pydantic BaseSettings with `.env` file loading
- All model paths configurable via environment variables

## Entry Points

| Entry Point | File | Command |
|-------------|------|---------|
| Backend API | `backend/app/main.py` | `uvicorn app.main:app --reload` (from `backend/`) |
| Structure Checker | `check_structure.py` | `python check_structure.py` (from root) |
| Frontend | `frontend/src/App.jsx` | Not configured yet |

## Cross-Cutting Concerns

### Logging
- structlog used in all backend modules
- Key events: startup, CSV receipt, prediction completion, health checks

### Error Handling
- HTTP exceptions at each validation stage (400, 422, 500, 503)
- Model loading failure raises and prevents startup
- No global exception handler middleware

### CORS
- Configured in `backend/app/main.py`
- Allows `http://localhost:3000` (React dev server)
- All methods and headers allowed
