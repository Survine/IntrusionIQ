# IntrusionIQ — Semester 6 PRD
## AI-Powered SOC Platform · Detection Foundation

---

## 1. Product Vision

**IntrusionIQ** is an open-source, AI-powered Security Operations Center (SOC) platform that detects network intrusions using machine learning. Semester 6 delivers the **Detection Foundation** — a local web application that:

1. Accepts CSV files of network traffic logs (CICIDS2017 dataset)
2. Runs them through a trained ML classification model
3. Displays results on a professional, real-time dashboard

> [!IMPORTANT]
> Semester 6 is a **proof-of-concept**. The goal is a clean, documented, working demo — not a distributed system. Keep scope tight.

---

## 2. Scope — What's In & What's Out

### In Scope (Semester 6)
| Area | Deliverable |
|------|------------|
| ML | Binary classification (BENIGN vs ATTACK) on CICIDS2017 |
| ML | Multi-model benchmarking (Logistic Regression, Random Forest, XGBoost) |
| Backend | FastAPI REST API — CSV upload, prediction, health check, metrics |
| Frontend | React + Vite dashboard — file upload, results table, charts, metrics |
| DevOps | Docker Compose for local 2-service deployment |
| Docs | Professional README, architecture diagram, project report |

### Out of Scope (Deferred to Sem 7/8)
- Real-time streaming (Kafka) — Sem 7
- Multi-class attack classification — Sem 7
- User authentication / RBAC — Sem 7
- Automated response / blocking — Sem 8
- Cloud deployment (K8s) — Sem 7
- Honeypot integration — Sem 8

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User (Browser)                       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│              Frontend (React + Vite)                     │
│         Port 5173 (dev) / 3000 (Docker)                  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐              │
│  │Dashboard │ │ThreatTbl │ │MetricsPanel │              │
│  └──────────┘ └──────────┘ └─────────────┘              │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────┐
│              Backend (FastAPI)                            │
│              Port 8000                                   │
│  ┌────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Routes  │→ │Services  │→ │ML Loader │                 │
│  │(Views) │  │(Logic)   │  │(Model)   │                 │
│  └────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────┘
         ▲
         │ Loads .joblib at startup
┌────────┴────────────────────────────────────────────────┐
│              ML Pipeline (Offline)                        │
│  Jupyter Notebooks → train.py → model.joblib             │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Backend Pattern — MVC + Service-Repository

The backend follows a **layered MVC architecture** with clear separation of concerns:

```
Request Flow:
  Route (Controller) → Schema (Validation) → Service (Business Logic) → ML Loader (Data/Model Access)
```

| Layer | Responsibility | Files |
|-------|---------------|-------|
| **Routes (Controller)** | Accept HTTP requests, validate input via schemas, delegate to services, return responses | `api/v1/routes/*.py` |
| **Schemas (Model/DTO)** | Pydantic models defining request/response shapes. Data validation & serialization | `schemas/*.py` |
| **Services (Business Logic)** | Core logic — run predictions, compute metrics, format results | `services/*.py` |
| **Core (Infrastructure)** | Config loading, ML model lifecycle, logging setup | `core/*.py` |

> [!NOTE]
> In Sem 6, there's no database, so no Repository layer. In Sem 7, when PostgreSQL is added, a `repositories/` layer will sit below `services/` for data access.

---

## 4. Detailed File Structure

Below is the **complete file tree** with file format annotations and purpose for every file.

```
IntrusionIQ/
│
├── .gitignore                          # Git ignore rules
├── .env.example                        # [NEW] Template for environment variables
├── README.md                           # Project overview, setup, screenshots
├── LICENSE                             # [NEW] MIT License
├── docker-compose.yml                  # 2-service local orchestration
│
├── ml/                                 # ── ML / Data Science Module ──
│   ├── requirements.txt                # Pinned Python ML dependencies
│   ├── notebooks/                      # Jupyter notebooks (EDA & experiments)
│   │   ├── 01_eda.ipynb                #   Exploratory Data Analysis
│   │   ├── 02_feature_engineering.ipynb #   Cleaning, SMOTE, scaling
│   │   └── 03_model_training.ipynb     #   Train, compare, evaluate models
│   ├── src/                            # Production-ready ML scripts
│   │   ├── __init__.py                 #   Package init
│   │   ├── preprocess.py               #   Data cleaning & feature engineering
│   │   ├── train.py                    #   Model training pipeline
│   │   ├── evaluate.py                 #   Metrics computation & plots
│   │   └── predict.py                  #   Inference / prediction functions
│   ├── models/                         # Serialized model artifacts
│   │   └── .gitkeep                    #   (models tracked via Git LFS or excluded)
│   ├── data/                           # Raw + processed datasets
│   │   ├── raw/                        #   Original CICIDS2017 CSVs (git-ignored)
│   │   │   └── .gitkeep
│   │   └── processed/                  #   Cleaned Parquet files (git-ignored)
│   │       └── .gitkeep
│   └── reports/                        # [NEW] Generated evaluation artifacts
│       └── .gitkeep                    #   confusion matrices, ROC curves (PNG)
│
├── backend/                            # ── FastAPI Backend ──
│   ├── Dockerfile                      # Multi-stage Python Docker image
│   ├── requirements.txt                # Pinned Python backend dependencies
│   ├── app/
│   │   ├── __init__.py                 # Package init
│   │   ├── main.py                     # FastAPI app factory + lifespan
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes/
│   │   │           ├── __init__.py
│   │   │           ├── health.py       # GET /api/v1/health
│   │   │           ├── predict.py      # POST /api/v1/predict
│   │   │           └── metrics.py      # [NEW] GET /api/v1/metrics
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py              # Pydantic Settings (loads .env)
│   │   │   ├── ml_loader.py           # Load model once at startup
│   │   │   └── logging_config.py      # [NEW] Structured JSON logging setup
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── health.py              # [NEW] Health response schema
│   │   │   ├── prediction.py          # Prediction request/response schemas
│   │   │   └── metrics.py             # [NEW] Metrics response schema
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── prediction_service.py  # [NEW] Prediction business logic
│   │   │   └── metrics_service.py     # [NEW] Metrics computation logic
│   │   └── models/                    # DB models (empty in Sem 6)
│   │       ├── __init__.py
│   │       └── .gitkeep
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py                # [NEW] Shared fixtures
│       ├── test_health.py             # [NEW] Health endpoint tests
│       ├── test_predict.py            # Prediction endpoint tests
│       └── test_metrics.py            # [NEW] Metrics endpoint tests
│
├── frontend/                          # ── React + Vite Frontend ──
│   ├── Dockerfile                     # Multi-stage Node Docker image
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.js                 # [NEW] Vite configuration
│   ├── .env.example                   # [NEW] Frontend env template
│   ├── index.html                     # [NEW] HTML entry point
│   ├── public/
│   │   └── favicon.svg                # [NEW] App icon
│   ├── src/
│   │   ├── main.jsx                   # [NEW] React DOM entry point
│   │   ├── App.jsx                    # Root component + routing
│   │   ├── App.css                    # [NEW] Global styles
│   │   ├── index.css                  # [NEW] CSS reset + design tokens
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.jsx        # [NEW] Navigation sidebar
│   │   │   │   ├── Header.jsx         # [NEW] Top bar with branding
│   │   │   │   └── Layout.jsx         # [NEW] Page layout wrapper
│   │   │   ├── Dashboard/
│   │   │   │   ├── StatCard.jsx       # [NEW] Summary metric card
│   │   │   │   ├── ThreatPieChart.jsx # [NEW] Benign vs Attack pie
│   │   │   │   └── AttackBarChart.jsx # [NEW] Attack type breakdown bar
│   │   │   ├── FileUpload/
│   │   │   │   └── FileUpload.jsx     # [NEW] Drag-and-drop CSV upload
│   │   │   ├── ThreatTable/
│   │   │   │   └── ThreatTable.jsx    # [NEW] Sortable results table
│   │   │   └── MetricsPanel/
│   │   │       └── MetricsPanel.jsx   # [NEW] Model performance display
│   │   ├── pages/
│   │   │   └── DashboardPage.jsx      # [NEW] Main dashboard page
│   │   ├── services/
│   │   │   └── api.js                 # Axios instance + API calls
│   │   ├── hooks/
│   │   │   └── usePrediction.js       # [NEW] React Query hook
│   │   └── utils/
│   │       └── formatters.js          # [NEW] Number/date formatting
│   └── __tests__/                     # [NEW] Frontend tests
│       └── App.test.jsx
│
└── docs/                              # ── Documentation ──
    ├── architecture.md                # [NEW] System architecture writeup
    ├── api-spec.md                    # [NEW] API contracts documentation
    └── assets/                        # [NEW] Diagrams & screenshots
        └── .gitkeep
```

---

## 5. Tech Stack — Pinned Versions

### 5.1 ML Pipeline

| Package | Version | Purpose |
|---------|---------|---------|
| `python` | 3.11.x | Runtime |
| `pandas` | 2.2.0 | Data manipulation |
| `numpy` | 1.26.4 | Numerical computation |
| `scikit-learn` | 1.4.0 | ML models, preprocessing, metrics |
| `xgboost` | 2.0.3 | Gradient boosting classifier |
| `imbalanced-learn` | 0.12.0 | SMOTE oversampling |
| `matplotlib` | 3.8.3 | Plotting (notebooks) |
| `seaborn` | 0.13.2 | Statistical plots |
| `joblib` | 1.3.2 | Model serialization |
| `pyarrow` | 15.0.0 | Parquet file I/O |

### 5.2 Backend

| Package | Version | Purpose |
|---------|---------|---------|
| `python` | 3.11.x | Runtime |
| `fastapi` | 0.115.0 | Web framework |
| `uvicorn[standard]` | 0.30.0 | ASGI server |
| `pydantic` | 2.9.0 | Data validation |
| `pydantic-settings` | 2.5.0 | .env config loading |
| `python-multipart` | 0.0.12 | File upload support |
| `scikit-learn` | 1.4.0 | Model loading (must match ML) |
| `xgboost` | 2.0.3 | Model loading (must match ML) |
| `joblib` | 1.3.2 | Model deserialization |
| `pandas` | 2.2.0 | CSV parsing in prediction |
| `numpy` | 1.26.4 | Array operations |
| `structlog` | 24.1.0 | Structured JSON logging |
| `python-dotenv` | 1.0.1 | Environment variable loading |

### 5.3 Backend — Dev/Test

| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | 8.1.0 | Test runner |
| `httpx` | 0.27.0 | Async test client for FastAPI |
| `pytest-cov` | 5.0.0 | Coverage reporting |

### 5.4 Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| `node` | 20 LTS | Runtime |
| `react` | 18.3.x | UI framework |
| `react-dom` | 18.3.x | DOM rendering |
| `vite` | 5.4.x | Build tool & dev server |
| `axios` | 1.7.x | HTTP client |
| `@tanstack/react-query` | 5.x | Server state management |
| `recharts` | 2.12.x | Chart components |
| `react-dropzone` | 14.x | Drag-and-drop file upload |
| `react-icons` | 5.x | Icon library |
| `react-hot-toast` | 2.4.x | Toast notifications |

> [!NOTE]
> **No Tailwind CSS** — we use vanilla CSS with CSS custom properties (design tokens) for maximum control and a premium dark-mode aesthetic. This avoids framework lock-in and teaches proper CSS fundamentals.

---

## 6. ML Pipeline Requirements

### 6.1 Dataset
- **Source:** CICIDS2017 — CSV version from [UNB](https://www.unb.ca/cic/datasets/ids-2017.html) or Kaggle
- **Files used for Sem 6:** `Monday-WorkingHours.pcap_ISCX.csv` + `Tuesday-WorkingHours.pcap_ISCX.csv`
- **Storage:** `ml/data/raw/` (git-ignored, documented in README)

### 6.2 Preprocessing Pipeline ([preprocess.py](file:///d:/IntrusionIQ/ml/src/preprocess.py))
1. Load CSV → Drop identifier columns (`Flow ID`, `Source IP`, `Destination IP`, `Timestamp`)
2. Replace `inf` values with `NaN` → Fill NaN with column median
3. Remove duplicate rows
4. Label encoding: `BENIGN` → 0, all attack labels → 1 (binary)
5. Feature scaling: `StandardScaler` (fit on train set only)
6. Class rebalancing: `SMOTE` (on train set only — never on test)
7. Train/test split: 80/20 stratified
8. Save processed data as `.parquet` to `ml/data/processed/`

### 6.3 Models to Train & Compare ([train.py](file:///d:/IntrusionIQ/ml/src/train.py))
| Model | Role | Hyperparameter Tuning |
|-------|------|----------------------|
| Logistic Regression | Baseline | `C`, `max_iter` |
| Random Forest | Primary | `n_estimators`, `max_depth`, `min_samples_split` |
| XGBoost | Challenger | `n_estimators`, `max_depth`, `learning_rate`, `scale_pos_weight` |

- Use `GridSearchCV` or `RandomizedSearchCV` with 5-fold stratified CV
- Save best model as `ml/models/best_model.joblib`
- Save scaler as `ml/models/scaler.joblib`
- Save label mapping as `ml/models/label_encoder.joblib`
- Save feature names list as `ml/models/feature_names.json`

### 6.4 Evaluation Metrics ([evaluate.py](file:///d:/IntrusionIQ/ml/src/evaluate.py))
| Metric | Target | Notes |
|--------|--------|-------|
| Accuracy | > 95% | Secondary metric (misleading with imbalance) |
| Precision | > 92% | Minimize false alarms |
| Recall | > 93% | Never miss a real attack |
| F1-Score | > 93% | **Primary metric** |
| ROC-AUC | > 0.97 | Discrimination ability |

- Generate and save: confusion matrix heatmap, ROC curve, precision-recall curve, feature importance bar chart
- Save all plots as PNG to `ml/reports/`
- Save metrics summary as `ml/reports/evaluation_metrics.json`

---

## 7. Backend API Contracts

### 7.1 `GET /api/v1/health`

**Purpose:** Verify the service is running and the ML model is loaded.

```json
// Response 200
{
  "status": "healthy",
  "version": "0.1.0",
  "model_loaded": true,
  "model_name": "RandomForest",
  "timestamp": "2026-03-07T19:59:32Z"
}
```

### 7.2 `POST /api/v1/predict`

**Purpose:** Accept a CSV file upload, run predictions, return results.

- **Request:** `multipart/form-data` with a `.csv` file field
- **Validation:** Max file size 50 MB, must be `.csv`, must contain expected feature columns

```json
// Response 200
{
  "total_records": 15000,
  "predictions": {
    "benign": 14200,
    "attack": 800
  },
  "attack_percentage": 5.33,
  "processing_time_ms": 1240,
  "details": [
    {
      "row_index": 0,
      "prediction": "BENIGN",
      "confidence": 0.97,
      "top_features": {
        "Flow Duration": 12345,
        "Total Fwd Packets": 4,
        "Flow Bytes/s": 890.5
      }
    }
  ]
}
```

```json
// Response 422 — Validation Error
{
  "detail": "CSV missing required columns: ['Flow Duration', 'Total Fwd Packets']"
}
```

### 7.3 `GET /api/v1/metrics`

**Purpose:** Return stored model evaluation metrics.

```json
// Response 200
{
  "model_name": "RandomForest",
  "model_version": "0.1.0",
  "dataset": "CICIDS2017",
  "metrics": {
    "accuracy": 0.9712,
    "precision": 0.9534,
    "recall": 0.9401,
    "f1_score": 0.9467,
    "roc_auc": 0.9823
  },
  "confusion_matrix": {
    "true_positive": 4521,
    "true_negative": 42890,
    "false_positive": 220,
    "false_negative": 285
  },
  "training_date": "2026-03-01T10:30:00Z",
  "feature_count": 76
}
```

---

## 8. Frontend Requirements

### 8.1 Design System

- **Theme:** Dark mode primary with glassmorphism accents
- **Color palette:**
  - Background: `#0a0e17` (deep navy black)
  - Surface: `#111827` (card backgrounds)
  - Primary: `#3b82f6` (electric blue)
  - Success/Benign: `#10b981` (emerald)
  - Danger/Attack: `#ef4444` (red)
  - Warning: `#f59e0b` (amber)
  - Text primary: `#f1f5f9`
  - Text secondary: `#94a3b8`
- **Typography:** Inter (Google Fonts) — `400`, `500`, `600`, `700` weights
- **Border radius:** `8px` cards, `6px` buttons, `12px` modals
- **Shadows:** Subtle glow effects using primary color with low opacity
- **Animations:** Smooth 200-300ms transitions on hover, fade-in on data load

### 8.2 Page Layout

```
┌────────────────────────────────────────────────────────┐
│  Sidebar (64px collapsed / 240px expanded)              │
│  ┌──────┐  ┌──────────────────────────────────────────┐│
│  │ Logo │  │ Header: "IntrusionIQ" + status indicator ││
│  │ Nav  │  ├──────────────────────────────────────────┤│
│  │ Links│  │                                          ││
│  │      │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       ││
│  │      │  │  │Total│ │Atks │ │Atk% │ │ F1  │       ││
│  │      │  │  └─────┘ └─────┘ └─────┘ └─────┘       ││
│  │      │  │                                          ││
│  │      │  │  ┌─── File Upload Zone ────┐             ││
│  │      │  │  │   Drag & drop CSV here  │             ││
│  │      │  │  └─────────────────────────┘             ││
│  │      │  │                                          ││
│  │      │  │  ┌── Pie Chart ──┐ ┌── Bar Chart ──┐    ││
│  │      │  │  │  Benign/Atk   │ │ Attack Types  │    ││
│  │      │  │  └───────────────┘ └───────────────┘    ││
│  │      │  │                                          ││
│  │      │  │  ┌── Threat Table (sortable, paginated) ─┤│
│  │      │  │  │ Row | Prediction | Confidence | ...   ││
│  │      │  │  └───────────────────────────────────────┤│
│  └──────┘  └──────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

### 8.3 Component Specifications

| Component | Props/State | Behavior |
|-----------|------------|----------|
| `Layout` | children | Renders sidebar + header + content area |
| `Sidebar` | activeRoute | Navigation links, collapsible |
| `Header` | — | App name, model status indicator (green/red dot) |
| `StatCard` | title, value, icon, trend, color | Displays one KPI with subtle animation on value change |
| `FileUpload` | onFileAccepted, isLoading | Drag-drop zone, file type validation, progress indicator |
| `ThreatPieChart` | data `{benign, attack}` | Animated donut chart (Recharts) |
| `AttackBarChart` | data `[{type, count}]` | Horizontal bar chart with gradient fills |
| `ThreatTable` | rows, sortConfig | Sortable columns, color-coded prediction cells, pagination (20/page) |
| `MetricsPanel` | metrics object | Grid of metric cards + confusion matrix heatmap |

---

## 9. Docker Configuration

### 9.1 [docker-compose.yml](file:///d:/IntrusionIQ/docker-compose.yml)

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: intrusioniq-backend
    ports:
      - "8000:8000"
    volumes:
      - ./ml/models:/app/models:ro
      - ./ml/reports:/app/reports:ro
    env_file:
      - .env
    environment:
      - MODEL_PATH=/app/models/best_model.joblib
      - SCALER_PATH=/app/models/scaler.joblib
      - METRICS_PATH=/app/reports/evaluation_metrics.json
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: intrusioniq-frontend
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    environment:
      - VITE_API_URL=http://localhost:8000
```

### 9.2 Backend Dockerfile

```dockerfile
# Stage 1: Build
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY ./app ./app
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 9.3 Frontend Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

## 10. Improvements Over Original Guide

| Area | Original Guide | IntrusionIQ PRD (Improved) |
|------|---------------|---------------------------|
| **Architecture** | Flat route files, logic mixed in routes | MVC + Service layer — routes delegate to services, clean separation |
| **Logging** | No mention | Structured JSON logging via `structlog` from day 1 |
| **Config** | `.env` mentioned loosely | `pydantic-settings` with typed config class, `.env.example` template |
| **ML Artifacts** | Save model only | Save model + scaler + label encoder + feature names + metrics JSON |
| **Data Storage** | CSV everywhere | Processed data saved as Parquet (2-5x faster, 3x smaller) |
| **Frontend Styling** | Tailwind CSS suggested | Vanilla CSS with design tokens — teaches fundamentals, no framework dep |
| **Testing** | One test file | `conftest.py` with shared fixtures, one test file per endpoint |
| **Docker** | Basic docker-compose | Multi-stage Dockerfiles, health checks, read-only volume mounts |
| **File Upload** | No validation specified | Max size, file type, required column validation with clear errors |
| **Reports** | Manual screenshot | Automated plot generation saved to `ml/reports/` as PNGs |
| **Git** | Basic mention | Conventional commits, [.gitignore](file:///d:/IntrusionIQ/.gitignore) template, `.env.example` pattern |

---

## 11. Proposed Changes — Implementation Order

### Phase 1: Foundation Setup
#### [MODIFY] [.gitignore](file:///d:/IntrusionIQ/.gitignore)
Populate with comprehensive Python/Node/ML ignore rules.

#### [NEW] [.env.example](file:///d:/IntrusionIQ/.env.example)
Environment variable template (MODEL_PATH, SCALER_PATH, API settings).

#### [NEW] [LICENSE](file:///d:/IntrusionIQ/LICENSE)
MIT License file.

---

### Phase 2: ML Pipeline
#### [MODIFY] [ml/requirements.txt](file:///d:/IntrusionIQ/ml/requirements.txt)
Pinned ML dependencies.

#### [MODIFY] [ml/src/preprocess.py](file:///d:/IntrusionIQ/ml/src/preprocess.py)
Data cleaning, feature engineering, SMOTE, train/test split pipeline.

#### [MODIFY] [ml/src/train.py](file:///d:/IntrusionIQ/ml/src/train.py)
Multi-model training with hyperparameter tuning, model serialization.

#### [MODIFY] [ml/src/evaluate.py](file:///d:/IntrusionIQ/ml/src/evaluate.py)
Metrics computation, plot generation, JSON export.

#### [MODIFY] [ml/src/predict.py](file:///d:/IntrusionIQ/ml/src/predict.py)
Inference function that loads model + scaler and returns predictions.

---

### Phase 3: Backend
#### [MODIFY] [backend/requirements.txt](file:///d:/IntrusionIQ/backend/requirements.txt)
Pinned backend dependencies.

#### [MODIFY] [backend/app/main.py](file:///d:/IntrusionIQ/backend/app/main.py)
FastAPI app factory with lifespan, CORS, router registration.

#### [NEW] [backend/app/core/config.py](file:///d:/IntrusionIQ/backend/app/core/config.py)
Pydantic Settings class loading from .env.

#### [NEW] [backend/app/core/ml_loader.py](file:///d:/IntrusionIQ/backend/app/core/ml_loader.py)
Model, scaler, and metadata loading at startup.

#### [NEW] [backend/app/core/logging_config.py](file:///d:/IntrusionIQ/backend/app/core/logging_config.py)
Structured JSON logging configuration.

#### [NEW] [backend/app/schemas/health.py](file:///d:/IntrusionIQ/backend/app/schemas/health.py)
Health response Pydantic model.

#### [MODIFY] [backend/app/schemas/prediction.py](file:///d:/IntrusionIQ/backend/app/schemas/prediction.py)
Prediction response Pydantic model.

#### [NEW] [backend/app/schemas/metrics.py](file:///d:/IntrusionIQ/backend/app/schemas/metrics.py)
Metrics response Pydantic model.

#### [NEW] [backend/app/services/prediction_service.py](file:///d:/IntrusionIQ/backend/app/services/prediction_service.py)
CSV parsing, feature validation, model inference orchestration.

#### [NEW] [backend/app/services/metrics_service.py](file:///d:/IntrusionIQ/backend/app/services/metrics_service.py)
Load and serve evaluation metrics from JSON.

#### [MODIFY] [backend/app/api/v1/routes/health.py](file:///d:/IntrusionIQ/backend/app/api/v1/routes/health.py)
Health check endpoint.

#### [MODIFY] [backend/app/api/v1/routes/predict.py](file:///d:/IntrusionIQ/backend/app/api/v1/routes/predict.py)
CSV upload + prediction endpoint.

#### [NEW] [backend/app/api/v1/routes/metrics.py](file:///d:/IntrusionIQ/backend/app/api/v1/routes/metrics.py)
Metrics endpoint.

---

### Phase 4: Frontend
All frontend files are new (existing scaffolds are empty).

#### [NEW] [frontend/vite.config.js](file:///d:/IntrusionIQ/frontend/vite.config.js)
#### [NEW] [frontend/index.html](file:///d:/IntrusionIQ/frontend/index.html)
#### [NEW] [frontend/src/index.css](file:///d:/IntrusionIQ/frontend/src/index.css)
Design tokens + CSS reset + dark theme.

#### [NEW] Complete component tree (Layout, Dashboard, FileUpload, ThreatTable, MetricsPanel)
#### [NEW] [frontend/src/services/api.js](file:///d:/IntrusionIQ/frontend/src/services/api.js)
Axios instance with base URL from env.

---

### Phase 5: Docker & Docs
#### [MODIFY] [docker-compose.yml](file:///d:/IntrusionIQ/docker-compose.yml)
#### [MODIFY] [backend/Dockerfile](file:///d:/IntrusionIQ/backend/Dockerfile)  
#### [MODIFY] [frontend/Dockerfile](file:///d:/IntrusionIQ/frontend/Dockerfile)
#### [MODIFY] [README.md](file:///d:/IntrusionIQ/README.md)
#### [NEW] [docs/architecture.md](file:///d:/IntrusionIQ/docs/architecture.md)

---

## 12. Verification Plan

### Automated Tests

**Backend unit tests** (run from project root):
```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v --cov=app --cov-report=term-missing
```
Expected: All endpoints return correct status codes and response shapes.

**Frontend build verification**:
```bash
cd frontend
npm install
npm run build
```
Expected: Build succeeds with no errors.

### Manual Verification

1. **ML Pipeline:** Run [03_model_training.ipynb](file:///d:/IntrusionIQ/ml/notebooks/03_model_training.ipynb) end-to-end → verify `best_model.joblib` appears in `ml/models/` and `evaluation_metrics.json` appears in `ml/reports/`
2. **Backend standalone:** Run `uvicorn app.main:app` → open `http://localhost:8000/docs` → test all 3 endpoints via Swagger UI
3. **Frontend standalone:** Run `npm run dev` → open `http://localhost:5173` → verify dashboard loads with dark theme
4. **Docker end-to-end:** Run `docker compose up --build` → upload a sample CSV via the dashboard → verify predictions appear in the table and charts render
5. **CSV validation:** Upload a malformed CSV (wrong columns) → verify a clear `422` error message appears on the dashboard

---

## 13. Timeline — 24-Week Execution Plan

| Weeks | Phase | Key Milestones |
|-------|-------|---------------|
| 1–2 | Environment + Setup | Repo initialized, all deps installed, `.gitignore` configured, dataset downloaded |
| 3–5 | EDA + Feature Eng | Notebooks 01 & 02 complete, cleaned Parquet saved |
| 6–9 | Model Training | 3 models trained, best model selected, evaluation report generated |
| 10–13 | Backend API | FastAPI with 3 endpoints, tests passing, Swagger docs live |
| 14–18 | Frontend Dashboard | All components built, charts rendering, file upload working |
| 19–20 | Docker + Integration | `docker compose up` runs full stack, end-to-end demo working |
| 21–24 | Documentation + Report | README polished, architecture diagram, academic report complete |
