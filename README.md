# IntrusionIQ 🛡️

> **AI-Powered Network Intrusion Detection for the Modern SOC**

IntrusionIQ is an end-to-end Security Operations Center (SOC) platform that combines a high-performance FastAPI backend with a modular React dashboard to deliver real-time network threat detection. Under the hood, it runs a **two-stage hybrid ML pipeline** that achieves **99.90% accuracy** on the CICIDS2017 benchmark — detecting both known attacks and zero-day anomalies.

---

## 📸 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT / SOC ANALYST                    │
│                        React Dashboard (Frontend)               │
└─────────────────────────┬───────────────────────────────────────┘
                          │  POST /api/v1/predict  (CSV Upload)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Python)                    │
│  • CSV validation & feature alignment (66 features)             │
│  • StandardScaler preprocessing (median imputation)             │
│                                                                 │
│  ┌──────────────── STAGE 1: Binary Detection ────────────────┐  │
│  │          Parallel "OR" Ensembler                          │  │
│  │  ┌──────────────────────┐   ┌───────────────────────┐     │  │
│  │  │   Voting Ensemble    │   │   Isolation Forest    │     │  │
│  │  │  RF + XGBoost + MLP  │ ─OR─  (Zero-Day Detector) │     │  │
│  │  │  (Known Attacks)     │   │   (Unsupervised)      │     │  │
│  │  └──────────┬───────────┘   └──────────┬────────────┘     │  │
│  │             └─────────────┬────────────┘                  │  │
│  │                    BENIGN or ATTACK?                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │ ATTACK                              │
│  ┌──────────────── STAGE 2: Attack Classification ───────────┐  │
│  │          Multi-Class XGBoost (15 attack types)            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔍 **Two-Stage ML Pipeline** | Stage 1 detects BENIGN vs ATTACK; Stage 2 classifies the specific attack type |
| 🧠 **Zero-Day Detection** | Isolation Forest catches never-seen-before anomalies without supervision |
| 🎯 **15-Class Classification** | Identifies DDoS, Botnet, PortScan, Heartbleed, SQL Injection, XSS, and more |
| ⚡ **High Performance** | 99.90% accuracy, 99.93% recall, 100.00% ROC-AUC on CICIDS2017 test set |
| 📊 **SOC Dashboard** | Modular React UI with live metrics, threat tables, and model performance panels |
| 📂 **CSV Bulk Analysis** | Upload any network flow capture CSV and receive per-flow predictions instantly |
| 🩺 **Health & Metrics API** | Dedicated endpoints for model readiness checks and performance metrics |

---

## 🗂️ Project Structure

```
IntrusionIQ/
├── backend/                    # FastAPI inference server
│   ├── app/
│   │   ├── api/v1/routes/
│   │   │   ├── predict.py      # POST /predict — core inference endpoint
│   │   │   ├── health.py       # GET  /health  — readiness check
│   │   │   └── metrics.py      # GET  /metrics — model performance stats
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic settings (env-driven)
│   │   │   └── ml_loader.py    # Model loading & two-stage inference logic
│   │   ├── schemas/            # Pydantic request/response models
│   │   └── main.py             # FastAPI app + CORS + lifespan
│   ├── models/                 # Trained model binaries (.pkl / .keras)
│   ├── artifacts/              # Scaler, feature names, label mapping
│   ├── tests/
│   └── requirements.txt
│
├── frontend/                   # React SOC dashboard
│   └── src/
│       ├── components/
│       │   ├── Dashboard/      # Main dashboard layout
│       │   ├── MetricsPanel/   # Model performance cards
│       │   └── ThreatTable/    # Per-flow prediction table
│       ├── pages/
│       │   └── Dashboard.jsx   # Dashboard page
│       ├── services/
│       │   └── api.js          # Axios API client
│       └── App.jsx
│
├── ml/                         # Data science workspace
│   ├── models/                 # Trained model files (source)
│   ├── artifacts/              # Scaler, feature names, label mapping (source)
│   ├── plots/                  # Training evaluation plots & confusion matrices
│   └── demo_sample.csv         # Sample CSV for testing predictions
│
├── docs/                       # Project documentation
│   ├── BACKEND_WORKFLOW.md     # End-to-end data lifecycle walkthrough
│   ├── ml_pipeline_guide.md    # Full ML pipeline notebook guide (EDA → Training)
│   └── implementation_plan.md  # Architecture & implementation decisions
│
└── docker-compose.yml
```

---

## 🤖 ML Pipeline

### Dataset
Trained on the **[CICIDS2017](https://www.kaggle.com/datasets/ciaboroniu/cicids2017)** (Canadian Institute for Cybersecurity Intrusion Detection System 2017) dataset — the industry-standard benchmark for network intrusion detection, containing ~2.8M labeled network flows across 15 traffic categories.

### Stage 1 — Parallel "OR" Binary Ensembler

Two parallel systems run simultaneously. A flow is flagged as `ATTACK` if **either** triggers:

1. **Voting Ensemble** (high recall on known attacks)
   - Random Forest + XGBoost + MLP Neural Network
   - Soft voting: averages the three probability scores
   - Threshold: `avg_probability ≥ 0.50` → ATTACK

2. **Isolation Forest** (zero-day resiliency)
   - Unsupervised anomaly detector — no labeled attack data needed
   - Flags statistically anomalous flows regardless of attack type
   - Zero-day flows caught only by Isolation Forest receive a nominal 0.90 confidence score

### Stage 2 — Multi-Class Attack Classifier

All Stage 1 `ATTACK` flows are passed to a **Multi-Class XGBoost** model that identifies the specific attack type from 15 classes:

| Class | Attack Type |
|---|---|
| 0 | BENIGN |
| 1 | Bot |
| 2 | DDoS |
| 3 | DoS GoldenEye |
| 4 | DoS Hulk |
| 5 | DoS Slowhttptest |
| 6 | DoS slowloris |
| 7 | FTP-Patator |
| 8 | Heartbleed |
| 9 | Infiltration |
| 10 | PortScan |
| 11 | SSH-Patator |
| 12 | Web Attack – Brute Force |
| 13 | Web Attack – SQL Injection |
| 14 | Web Attack – XSS |

> **Benign Override**: If Stage 2 classifies a flow as BENIGN with ≥ 90% confidence, it overrides the Stage 1 ATTACK decision. If Stage 2 confidence is < 90%, the flow is kept as ATTACK and flagged **"Needs Review"** for an analyst.

### Model Performance (CICIDS2017 Test Set — 504,160 samples)

| Metric | Score |
|---|---|
| Accuracy | **99.90%** |
| Precision | **99.51%** |
| Recall | **99.93%** |
| F1 Score | **99.72%** |
| ROC-AUC | **100.00%** |
| False Positive Rate | **0.10%** |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/IntrusionIQ.git
cd IntrusionIQ/backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.
Interactive API docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd IntrusionIQ/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### 3. Environment Variables

Create a `.env` file inside `backend/` (copy from `.env.example` if provided):

```env
APP_NAME=IntrusionIQ
APP_VERSION=1.0.0
DEBUG=False

# Model paths (relative to backend/)
RF_MODEL_PATH=models/rf_model.pkl
XGB_MODEL_PATH=models/xgb_model.pkl
MLP_MODEL_PATH=models/mlp_model.keras
ISO_MODEL_PATH=models/iso_model.pkl
MULTICLASS_MODEL_PATH=models/multiclass_xgb.pkl

# Artifact paths
SCALER_PATH=artifacts/scaler.pkl
FEATURES_PATH=artifacts/feature_names.json
LABEL_MAPPING_PATH=artifacts/label_mapping.json
```

---

## 📡 API Reference

### `POST /api/v1/predict`
Upload a CSV of network flows and receive per-flow threat predictions.

- **Request**: `multipart/form-data` with a `.csv` file containing the 66 required network flow features
- **Response**:
```json
{
  "total_flows": 1000,
  "attack_count": 42,
  "benign_count": 958,
  "attack_percentage": 4.20,
  "attack_type_counts": {
    "DDoS": 28,
    "PortScan": 10,
    "Bot": 4
  },
  "predictions": [
    {
      "prediction": "ATTACK",
      "confidence": 0.9823,
      "attack_type": "DDoS",
      "attack_type_confidence": 0.9741,
      "model": "two_stage_pipeline"
    }
  ]
}
```

### `GET /api/v1/health`
Returns API and model readiness status.
```json
{
  "status": "healthy",
  "app_name": "IntrusionIQ",
  "version": "1.0.0",
  "model_loaded": true
}
```

### `GET /api/v1/metrics`
Returns production model performance metrics.
```json
{
  "model_name": "Voting Ensemble (RF + XGBoost + MLP)",
  "accuracy": 99.90,
  "precision": 99.51,
  "recall": 99.93,
  "f1_score": 99.72,
  "roc_auc": 100.00,
  "false_positive_rate": 0.10,
  "training_dataset": "CICIDS2017"
}
```

---

## 🧪 Testing

```bash
# From the backend/ directory
cd backend
pytest tests/ -v
```

A `demo_sample.csv` is provided in `ml/` to test the `/predict` endpoint directly.

---

## 🛠️ Tech Stack

### Backend
| Library | Purpose |
|---|---|
| **FastAPI** | Async REST API framework |
| **Pydantic v2** | Request/response schema validation |
| **Scikit-Learn** | Random Forest, Isolation Forest, StandardScaler |
| **XGBoost** | Binary and multi-class gradient boosted classifiers |
| **Keras / TensorFlow** | MLP Neural Network |
| **Pandas / NumPy** | Data preprocessing & feature alignment |
| **Joblib** | Model serialization / deserialization |
| **Structlog** | Structured JSON logging |

### Frontend
| Library | Purpose |
|---|---|
| **React** | Component-based UI |
| **Vite** | Fast build tooling |
| **Axios** (via `api.js`) | HTTP client for backend communication |

### ML / Data Science
| Library | Purpose |
|---|---|
| **CICIDS2017** | Training dataset (2.8M network flow records) |
| **Imbalanced-Learn / SMOTE** | Class balancing during training |
| **LightGBM** | Benchmarked alternative to XGBoost |

---

## 📁 Model Files

| File | Description | Size |
|---|---|---|
| `rf_model.pkl` | Random Forest (binary) | ~20 MB |
| `xgb_model.pkl` | XGBoost (binary) | ~1 MB |
| `mlp_model.keras` | MLP Neural Network (binary) | ~750 KB |
| `iso_model.pkl` | Isolation Forest (anomaly) | ~700 KB |
| `voting_ensemble.pkl` | Pre-built voting ensemble | ~23 MB |
| `sequential_pipeline.pkl` | Sequential pipeline artifact | ~1.7 MB |
| `multiclass_xgb.pkl` | XGBoost multi-class (15 classes) | ~9 MB |
| `multiclass_lgbm.pkl` | LightGBM multi-class | ~7 MB |
| `multiclass_rf.pkl` | Random Forest multi-class | ~96 MB |
| `multiclass_mlp.keras` | MLP multi-class | ~750 KB |

> **Note**: Large model files are tracked via Git LFS. Run `git lfs pull` after cloning if needed.

---

## 📜 License

This project is intended for academic and research use. Please cite CICIDS2017 if you use their dataset in any publication.

---

## 🙏 Acknowledgements

- **[CICIDS2017 Dataset](https://www.unb.ca/cic/datasets/ids-2017.html)** — Canadian Institute for Cybersecurity
- **[Scikit-Learn](https://scikit-learn.org/)**, **[XGBoost](https://xgboost.readthedocs.io/)**, **[Keras](https://keras.io/)** — Core ML libraries
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance Python API framework
