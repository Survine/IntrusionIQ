# Directory Structure

## Root Layout

```
IntrusionIQ/
├── .agent/                    # GSD skills and workflows (not project code)
├── .git/
├── .gitattributes             # Git LFS tracking rules
├── .gitignore                 # Python, Node, Docker, IDE ignores
├── README.md                  # Empty
├── check_structure.py         # Project structure validation script
├── docker-compose.yml         # Empty (placeholder)
│
├── backend/                   # FastAPI inference API
│   ├── .env                   # Environment configuration
│   ├── .venv/                 # Python virtual environment (gitignored)
│   ├── Dockerfile             # Empty (placeholder)
│   ├── requirements.txt       # Pinned Python dependencies
│   ├── app/                   # Application source code
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app entry point + lifespan
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes/
│   │   │           ├── __init__.py
│   │   │           ├── health.py      # GET /api/v1/health
│   │   │           ├── metrics.py     # GET /api/v1/metrics
│   │   │           └── predict.py     # POST /api/v1/predict
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Pydantic Settings
│   │   │   └── ml_loader.py          # Model loading + inference pipeline
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── health.py             # HealthResponse
│   │       ├── metrics.py            # MetricsResponse
│   │       └── prediction.py         # PredictionResponse, BulkPredictionResponse
│   ├── models/                # Production model files (Git LFS)
│   │   ├── mlp_model.keras    # MLP binary classifier (~762 KB)
│   │   ├── multiclass_xgb.pkl # XGBoost 15-class (~132B LFS pointer)
│   │   ├── rf_model.pkl       # Random Forest binary (~133B LFS pointer)
│   │   ├── voting_ensemble.pkl # Legacy ensemble (~133B LFS pointer)
│   │   └── xgb_model.pkl     # XGBoost binary (~132B LFS pointer)
│   ├── artifacts/             # Shared preprocessing artifacts
│   │   ├── feature_names.json # 66 feature column names
│   │   ├── label_mapping.json # Class index → attack label map
│   │   └── scaler.pkl         # StandardScaler (~129B LFS pointer)
│   └── tests/
│       ├── __init__.py
│       └── test_predict.py    # Empty (placeholder)
│
├── frontend/                  # React dashboard (scaffolded, not implemented)
│   ├── Dockerfile             # Empty (placeholder)
│   ├── package.json           # Empty (placeholder)
│   └── src/
│       ├── App.jsx            # Empty (placeholder)
│       ├── components/
│       │   ├── Dashboard/
│       │   │   └── .gitkeep
│       │   ├── MetricsPanel/
│       │   │   └── .gitkeep
│       │   └── ThreatTable/
│       │       └── .gitkeep
│       ├── pages/
│       │   └── Dashboard.jsx  # Empty (placeholder)
│       └── services/
│           └── api.js         # Empty (placeholder)
│
├── ml/                        # ML training outputs (from Kaggle)
│   ├── demo_sample.csv        # Sample CSV for testing (~366 KB)
│   ├── models/                # All trained models (superset of backend/models)
│   │   ├── iso_model.pkl      # Isolation Forest (anomaly detection)
│   │   ├── lgbm_model.pkl     # LightGBM binary
│   │   ├── mlp_model.keras    # MLP binary (~762 KB)
│   │   ├── multiclass_lgbm.pkl
│   │   ├── multiclass_mlp.keras  # (~773 KB)
│   │   ├── multiclass_rf.pkl
│   │   ├── multiclass_xgb.pkl
│   │   ├── rf_model.pkl
│   │   ├── sequential_pipeline.pkl
│   │   ├── voting_ensemble.pkl
│   │   └── xgb_model.pkl
│   ├── artifacts/             # Training artifacts
│   │   ├── feature_names.json
│   │   ├── hybrid_metadata.json  # Pipeline configuration metadata
│   │   ├── label_mapping.json
│   │   └── scaler.pkl
│   └── plots/                 # Training evaluation plots (19 PNG files)
│       ├── all_models_comparison.png
│       ├── ensemble_cm_*.png
│       ├── multiclass_cm_*.png
│       ├── roc_curves_all.png
│       └── ... (19 total)
│
└── docs/                      # Project documentation
    ├── implementation_plan.md  # Original project plan (~32 KB)
    ├── ml_pipeline_guide.md   # ML pipeline guide (~39 KB)
    ├── walkthrough.md         # Implementation walkthrough (~4 KB)
    ├── after binary end point status.md
    └── multiclass api update   # Multi-class update notes
```

## Key Locations

| What | Where |
|------|-------|
| API entry point | `backend/app/main.py` |
| Route handlers | `backend/app/api/v1/routes/` |
| ML inference logic | `backend/app/core/ml_loader.py` |
| Configuration | `backend/app/core/config.py` + `backend/.env` |
| Pydantic schemas | `backend/app/schemas/` |
| Production models | `backend/models/` |
| Preprocessing artifacts | `backend/artifacts/` |
| All trained models | `ml/models/` |
| Training plots | `ml/plots/` |
| Frontend components | `frontend/src/components/` |
| Test files | `backend/tests/` |

## Naming Conventions

### Files
- Python: `snake_case.py` (standard Python convention)
- Routes: named by domain (`health.py`, `predict.py`, `metrics.py`)
- Schemas: named by domain (`health.py`, `prediction.py`, `metrics.py`)
- Models: `{algorithm}_model.{ext}` (e.g., `rf_model.pkl`, `mlp_model.keras`)
- Multi-class models: `multiclass_{algorithm}.{ext}`

### Directories
- Lowercase with underscores or hyphens
- Component folders use PascalCase (`Dashboard/`, `MetricsPanel/`, `ThreatTable/`)

### Code
- Python classes: PascalCase (`MLModels`, `Settings`, `PredictionResponse`)
- Python functions: snake_case (`load_models`, `predict_two_stage`)
- API routes: kebab-case paths (`/api/v1/predict`, `/api/v1/health`)
