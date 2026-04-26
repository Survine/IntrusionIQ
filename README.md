# IntrusionIQ — AI-Powered Network Intrusion Detection System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![XGBoost](https://img.shields.io/badge/XGBoost-Ensemble-FF6600?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-grade, ML-powered Security Operations Center (SOC) platform for real-time network intrusion detection.**

*Semester 6 Mini Project → Foundation for a 3-semester SOC/SOAR Platform*

[Live Demo](#how-to-run) · [Architecture](#architecture) · [ML Pipeline](#ml-pipeline) · [API Docs](#api-reference) · [Roadmap](#roadmap)

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What Problem Does This Solve?](#2-what-problem-does-this-solve)
3. [Architecture](#3-architecture)
4. [ML Pipeline](#4-ml-pipeline)
5. [Tech Stack](#5-tech-stack)
6. [Project Structure](#6-project-structure)
7. [Dataset](#7-dataset)
8. [Model Performance](#8-model-performance)
9. [Inference Pipeline (Two-Stage)](#9-inference-pipeline-two-stage)
10. [Frontend Dashboard](#10-frontend-dashboard)
11. [How to Run](#11-how-to-run)
12. [API Reference](#12-api-reference)
13. [Key Design Decisions & Trade-offs](#13-key-design-decisions--trade-offs)
14. [Known Limitations](#14-known-limitations)
15. [Roadmap](#15-roadmap)
16. [References](#16-references)

---

## 1. Project Overview

**IntrusionIQ** is an AI-powered Network Intrusion Detection System (IDS) and Security Operations Center (SOC) platform. It ingests network flow data, passes it through a multi-stage machine learning pipeline, and surfaces threats on an analyst-ready dashboard with attack classification, confidence scores, and severity labels.

The system is designed around the industry-standard **CICIDS2017** benchmark dataset and targets detection across **15 attack classes** including DDoS, Port Scanning, Brute Force, Web Attacks (SQLi, XSS), Botnet C2, and Infiltration.

| Semester | Phase | Status |
|----------|-------|--------|
| Sem 6 | Detection Foundation — CSV upload, ML inference, React dashboard, Docker | ✅ Complete |
| Sem 7 | Full Detection Platform — Kafka streaming, SHAP explainability, RBAC, cloud | 🔜 Planned |
| Sem 8 | SOAR — Automated response playbooks, firewall integration, honeypot | 🔜 Planned |

---

## 2. What Problem Does This Solve?

Enterprise-grade SIEM tools (Splunk: $150K+/year, IBM QRadar: $200K+/year) are:
- Closed-source with opaque ML models
- Expensive and inaccessible to smaller organisations
- Not built for modern explainability requirements (SHAP, MITRE ATT&CK mapping)

IntrusionIQ delivers a **modern, open-source, explainable, and cloud-native alternative** — built on the same benchmark datasets used in academic and industry research.

---

## 3. Architecture

### Sem 6 — Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Analyst)                       │
│                React Dashboard  :3000                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (CSV Upload / Metrics / Health)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend  :8000                         │
│                                                             │
│  POST /api/v1/predict                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             STAGE 1 — Parallel OR Ensemble           │   │
│  │                                                      │   │
│  │   ┌──────────────────────┐  ┌──────────────────┐     │   │
│  │   │  Voting Ensemble     │  │ Isolation Forest │     │   │
│  │   │  RF + XGB + MLP      │  │ (Zero-day gate)  │     │   │
│  │   │  Threshold = 0.50    │  │ Anomaly = -1     │     │   │
│  │   └──────────┬───────────┘  └────────┬─────────┘     │   │
│  │              │  OR Logic              │              │   │
│  │              └───────────┬────────────┘              │   │
│  │                          ▼                           │   │
│  │              ATTACK?  Yes → Stage 2                  │   │
│  │              BENIGN?  Both agreed → Done             │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                               │
│  ┌──────────────────────────▼───────────────────────────┐   │
│  │       STAGE 2 — Multiclass XGBoost (15 classes)      │   │
│  │                                                      │   │
│  │  Confidence >= 0.90 + BENIGN → Override to BENIGN    │   │
│  │  Confidence <  0.90 + BENIGN → "Needs Review"        │   │
│  │  Any attack class            → Label (e.g. DDoS)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  GET  /api/v1/metrics        GET  /api/v1/health            │
└─────────────────────────────────────────────────────────────┘
         │
         │  Volume Mount (local) / COPY (Docker prod)
         ▼
┌─────────────────────────┐
│       ML Models         │
│  rf_model.pkl           │
│  xgb_model.pkl          │
│  mlp_model.keras        │
│  multiclass_xgb.pkl     │
│  iso_model.pkl          │
│  scaler.pkl             │
│  feature_names.json     │
└─────────────────────────┘
```

### Data Flow

```
CSV Upload → Column Validation → Whitespace Strip → Feature Selection (66 features)
→ StandardScaler Transform → Stage 1 Parallel Inference
→ [Attack flows] → Stage 2 Multiclass Classification
→ JSON Response → React Dashboard Visualisation
```

---

## 4. ML Pipeline

### Dataset Processing

| Step | Action | Detail |
|------|--------|--------|
| Load | 8 CSV files | 2,830,743 raw rows, 79 features |
| Clean | Fix infinities, NaNs, duplicates, encoding | 2,520,798 rows remain |
| Engineer | Binary + multiclass labels, drop zero-variance columns | 66 features retained |
| Scale | StandardScaler (mean=0, std=1) | Required for MLP; consistent pipeline |
| Split | Stratified 80/20 | Class ratios preserved |
| Balance | SMOTE on training set only | 1:1 binary; 100K/class multiclass |

### Model Training Summary

**Binary Classification (ATTACK vs BENIGN)**

| Model | F1 Score | Recall | FPR | Notes |
|-------|----------|--------|-----|-------|
| Random Forest | 99.68% | 99.92% | 0.11% | Strong baseline |
| XGBoost | 99.73% | 99.97% | 0.11% | Best individual model |
| LightGBM | 99.66% | 99.94% | 0.13% | Fastest training |
| MLP Neural Net | 98.26% | 99.80% | 0.68% | Deep learning baseline |
| Isolation Forest | 49.65% | 41.12% | 4.98% | Unsupervised; zero-day value |
| **Voting Ensemble** ⭐ | **99.72%** | **99.93%** | **0.10%** | **Production model** |
| Sequential Pipeline | 58.27% | 41.12% | 0.00% | Architecture comparison |

**Multiclass Classification (15 classes)**

| Model | Accuracy | F1 Macro | F1 Weighted |
|-------|----------|----------|-------------|
| XGBoost ⭐ | 99.87% | 87.00% | 99.87% |
| Random Forest | 99.41% | 83.44% | 99.57% |
| MLP Neural Net | 99.38% | 77.62% | 99.53% |

> F1 Macro is the key metric for multiclass — it measures rare class detection equally.

---

## 5. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| ML Training | Python, scikit-learn, XGBoost, Keras/TensorFlow, SMOTE | Industry-standard ML ecosystem |
| ML Serving | FastAPI + Python | Same runtime as models — no inter-service latency |
| Backend Framework | FastAPI 0.115 | Async, Pydantic validation, auto Swagger docs |
| Frontend | React 18 + Vite | Modern SPA standard; Vite 10x faster than CRA |
| Styling | Tailwind CSS v4 | Utility-first; no custom CSS overhead |
| Charts | ECharts + echarts-for-react | Rich visualisation; donut, histogram support |
| Containerisation | Docker + Docker Compose | One-command reproducible deployment |
| Web Server | Nginx (frontend container) | Static file serving + SPA routing + reverse proxy |
| Training Environment | Kaggle Notebooks (2x T4 GPU) | Dataset size (~843MB) exceeds Colab limits |

---

## 6. Project Structure

```
IntrusionIQ/
│
├── README.md
├── .gitignore
├── docker-compose.yml           ← Local: volume-mounted models
├── docker-compose.prod.yml      ← Cloud: models baked into image
│
├── backend/
│   ├── .env                     ← Runtime config (NOT committed to Git)
│   ├── requirements.txt         ← Pinned dependencies
│   ├── Dockerfile               ← Local container (volume mounts)
│   ├── Dockerfile.prod          ← Production (COPY models in)
│   ├── .dockerignore
│   ├── models/
│   │   ├── rf_model.pkl
│   │   ├── xgb_model.pkl
│   │   ├── mlp_model.keras
│   │   ├── multiclass_xgb.pkl
│   │   └── iso_model.pkl
│   ├── artifacts/
│   │   ├── scaler.pkl
│   │   └── feature_names.json
│   └── app/
│       ├── main.py              ← Lifespan context manager, CORS, routers
│       ├── core/
│       │   ├── config.py        ← Pydantic-settings from .env
│       │   └── ml_loader.py     ← Model loading + two-stage inference
│       ├── schemas/
│       │   ├── health.py
│       │   ├── metrics.py
│       │   └── prediction.py
│       └── api/v1/routes/
│           ├── health.py
│           ├── metrics.py
│           └── predict.py
│
├── frontend/
│   ├── Dockerfile               ← Multi-stage: Node build → Nginx serve
│   ├── nginx.conf               ← SPA routing + /api reverse proxy
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── App.jsx              ← Dashboard composition
│       ├── index.css            ← Global Tailwind + typography
│       ├── components/
│       │   ├── UploadPanel.jsx
│       │   ├── ResultsPanel.jsx
│       │   ├── SignalRail.jsx
│       │   ├── ThreatChart.jsx
│       │   ├── AttackTypeChart.jsx
│       │   └── ConfidenceHistogram.jsx
│       ├── hooks/
│       │   ├── useUpload.js
│       │   ├── useMetrics.js
│       │   └── useHealth.js
│       ├── services/
│       │   └── api.js           ← All backend communication
│       └── constants/           ← Navigation, thresholds, validation
│
└── ml/
    └── notebooks/               ← Kaggle training notebooks
        ├── 01_data_cleaning_eda.ipynb
        ├── 02_binary_classification.ipynb
        ├── 03_multiclass_classification.ipynb
        └── 04_hybrid_models.ipynb
```

---

## 7. Dataset

**CICIDS2017 — Canadian Institute for Cybersecurity IDS Dataset**

| Property | Value |
|----------|-------|
| Source | University of New Brunswick (unb.ca/cic/datasets/ids-2017.html) |
| Also on | Kaggle: `hridaybardhan/intrusioniq` |
| Raw size | ~843 MB, 8 CSV files |
| Raw rows | 2,830,743 network flow records |
| Features | 79 columns (66 used after cleaning) |
| Classes | 15 (BENIGN + 14 attack types) |
| Imbalance | BENIGN = 83.1% of all records |

**Attack classes present:**

```
BENIGN · DDoS · PortScan · DoS Hulk · DoS GoldenEye · DoS slowloris
DoS Slowhttptest · FTP-Patator · SSH-Patator · Bot · Web Attack-Brute Force
Web Attack-XSS · Web Attack-Sql Injection · Infiltration · Heartbleed
```

> ⚠️ **Do not commit the dataset to Git.** Download from the sources above and place in `ml/data/` (gitignored).

---

## 8. Model Performance

### Binary Detection — Voting Ensemble (Production)

| Metric | Value |
|--------|-------|
| Accuracy | 99.90% |
| Precision | 99.51% |
| Recall | 99.93% |
| F1 Score | **99.72%** |
| ROC-AUC | 100.00% |
| False Positive Rate | **0.10%** |

*Evaluated on 504,160 held-out test samples (20% stratified split).*

### Multiclass — XGBoost (Stage 2)

Notable per-class F1 scores (XGBoost):

| Class | F1 |
|-------|-----|
| BENIGN | 1.00 |
| DDoS | 1.00 |
| PortScan | 0.99 |
| DoS Hulk | 1.00 |
| Heartbleed | 1.00 |
| Bot | 0.79 |
| Web Brute Force | 0.72 |
| Web SQL Injection | 0.44 ⚠️ |
| Web XSS | 0.46 ⚠️ |
| Infiltration | 0.67 ⚠️ |

> Rare classes (SQL Injection: 21 training samples, Heartbleed: 11 training samples) remain the biggest challenge. Addressed in Sem 7 via additional datasets and SHAP-guided feature analysis.

---

## 9. Inference Pipeline (Two-Stage)

### Stage 1 — Parallel OR Ensemble

Every incoming network flow is evaluated by **two detectors simultaneously**:

**Path A — Voting Ensemble (known attack detection)**
```
RF.predict_proba()[:, 1]  \
XGB.predict_proba()[:, 1]  → average → threshold 0.50 → ATTACK / BENIGN
MLP.predict()[:, 0]       /
```

**Path B — Isolation Forest (zero-day / novel attack detection)**
```
iso.predict() → -1 (anomaly) = ATTACK | +1 (normal) = BENIGN
```

**OR Decision:** If *either* path flags ATTACK → forward to Stage 2.

*Trade-off: OR logic increases recall for novel attacks at the cost of a modest false positive rate increase from Isolation Forest (standalone FPR: 4.98%), mitigated by Stage 2's confidence-gated override.*

### Stage 2 — Multiclass XGBoost + BENIGN Override

| Stage 2 Prediction | Confidence | Final Label | attack_type |
|--------------------|------------|-------------|-------------|
| Any attack class | any | ATTACK | e.g. "DDoS" |
| BENIGN | ≥ 0.90 | BENIGN | null |
| BENIGN | < 0.90 | ATTACK | "Needs Review" |

**Why 0.90 threshold?** Rare classes (SQLi F1=0.44, XSS F1=0.46) mean a low-confidence BENIGN prediction from Stage 2 could silently suppress a real attack detection. 0.90 requires near-certainty before overriding Stage 1's ATTACK signal.

---

## 10. Frontend Dashboard

The React dashboard provides a complete analyst workflow:

| Feature | Description |
|---------|-------------|
| **CSV Upload** | Drag-and-drop with validation, row estimation, large file warnings |
| **Health Panel** | Live API + model status (RF, XGB, MLP, ISO, Multiclass) |
| **Metrics Panel** | Precision, Recall, F1, FPR from Voting Ensemble |
| **Summary Cards** | Total flows / Attack count / Benign count / Attack % / Needs Review |
| **Threat Chart** | BENIGN vs ATTACK donut chart |
| **Attack Type Chart** | Per-class distribution donut |
| **Confidence Histogram** | Score distribution across all flows |
| **Results Table** | Per-flow: label, attack_type, confidence, stage, severity — sortable, filterable |
| **CSV Export** | Download filtered table for offline review and reporting |

---

## 11. How to Run

### Prerequisites

- Docker Desktop (updated)
- Git

### Clone & Setup

```bash
git clone https://github.com/Survine/IntrusionIQ.git
cd IntrusionIQ
```

### Download Models from Kaggle

Download the following files from your Kaggle notebook outputs (`hridaybardhan/intrusioniq`) and place them as shown:

```
backend/models/
  ├── rf_model.pkl
  ├── xgb_model.pkl
  ├── mlp_model.keras
  ├── multiclass_xgb.pkl
  └── iso_model.pkl

backend/artifacts/
  ├── scaler.pkl
  └── feature_names.json
```

### Configure Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set paths if needed (defaults should work)
```

### Run with Docker

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| React Dashboard | http://localhost:3000 |
| FastAPI Backend | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

### Run without Docker (Development)

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows PowerShell
pip install -r requirements.txt
fastapi dev app/main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Test with Sample Data

Upload any CICIDS2017 CSV file (e.g., `Friday-Afternoon-DDos.pcap_ISCX.csv`) through the dashboard, or use the Swagger UI at `/docs` to POST to `/api/v1/predict`.

---

## 12. API Reference

### `GET /api/v1/health`

Returns server and model load status.

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `GET /api/v1/metrics`

Returns Voting Ensemble performance metrics.

```json
{
  "model": "Voting Ensemble (RF + XGBoost + MLP)",
  "accuracy": 0.9990,
  "precision": 0.9951,
  "recall": 0.9993,
  "f1_score": 0.9972,
  "roc_auc": 1.0000,
  "false_positive_rate": 0.0010
}
```

### `POST /api/v1/predict`

Accepts a CICIDS2017-format CSV file. Returns per-flow predictions.

**Request:** `multipart/form-data` with field `file` (CSV).

**Response:**
```json
{
  "total_flows": 1000,
  "attack_count": 579,
  "benign_count": 421,
  "attack_percentage": 57.9,
  "attack_type_breakdown": {
    "DDoS": 579
  },
  "predictions": [
    {
      "flow_index": 0,
      "prediction": "ATTACK",
      "confidence": 1.0,
      "attack_type": "DDoS",
      "model": "voting_ensemble"
    }
  ]
}
```

> Full Swagger documentation available at `http://localhost:8000/docs` when the server is running.

---

## 13. Key Design Decisions & Trade-offs

| Decision | Choice | Why | Trade-off |
|----------|--------|-----|-----------|
| **Model loading** | Load RF/XGB/MLP individually with native loaders | `voting_ensemble.pkl` with dill caused TensorFlow to hang on startup | Slightly more startup code; worth the stability |
| **Ensemble logic** | Reconstruct soft voting in code | Transparent, debuggable, no black-box pkl | Must keep in sync with trained weights |
| **Stage 1 — OR logic** | Voting Ensemble ∥ Isolation Forest | Zero-day detection; ISO catches novel attacks supervised models never saw | FPR increases; mitigated by Stage 2 override |
| **BENIGN override threshold** | 0.90 | Rare classes (SQLi F1=0.44) make low-confidence BENIGN predictions dangerous | Very low-confidence BENIGN edge cases surface as "Needs Review" instead |
| **FastAPI over Node.js** | FastAPI (Python) | ML models live in Python; same runtime eliminates inter-service serialisation | Smaller JS ecosystem for backend; acceptable for this use case |
| **Vite over CRA** | Vite | 10x faster HMR; modern standard in 2025 | Slightly different config conventions |
| **Multi-stage Docker build** | Node build → Nginx serve | Final frontend image ~25MB vs ~1GB with Node included | Slightly more complex Dockerfile |
| **Metrics hardcoded** | Yes (Sem 6) | Shipping 504K-row test set with backend is impractical | Metrics don't reflect retraining; upgraded to DB query in Sem 7 |
| **SMOTE on training only** | Strict | Applying SMOTE to test set causes data leakage — inflated metrics | More complex pipeline; correctness is non-negotiable |

---

## 14. Known Limitations

1. **Rare class detection is weak.** SQL Injection (F1=0.44), XSS (F1=0.46), and Infiltration (F1=0.67) have few training samples. Future: additional datasets, few-shot learning, SHAP-guided feature engineering.

2. **Isolation Forest boundary is dataset-specific.** ISO was calibrated on CICIDS2017 (83% BENIGN). Real production networks with different traffic distributions will shift the anomaly boundary. FPR in production may differ from the measured 4.98%.

3. **ISO nominal confidence is not a probability.** The 0.90 value assigned to ISO-only detections is a design constant, not a model output. ISO has no `predict_proba()`.

4. **scikit-learn version mismatch.** Models trained on Kaggle with scikit-learn 1.6.1; local environment uses 1.8.0. Predictions are verified correct but a deprecation warning appears. Scheduled for resolution in Sem 7 retraining.

5. **Static CSV input only.** Sem 6 processes historical CSV files. Real-time streaming (Apache Kafka) is Sem 7 scope.

6. **No authentication.** The API is open. RBAC and JWT authentication are Sem 7 scope.

---

## 15. Roadmap

### Sem 7 — Full Detection Platform

- [ ] Apache Kafka real-time streaming pipeline (replace CSV upload)
- [ ] PostgreSQL + TimescaleDB persistent storage
- [ ] SHAP explainability per detection ("flagged as DDoS because Flow Packets/s = 9,840")
- [ ] JWT authentication + Role-Based Access Control (Analyst / Manager / Admin)
- [ ] WebSocket real-time threat feed on dashboard
- [ ] Email + Slack alerting
- [ ] Incident management (Open → Assigned → Investigating → Closed)
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Cloud deployment on AWS EKS / Azure AKS
- [ ] Retrain all models with matched library versions (scikit-learn 1.6.1)
- [ ] Prometheus + Grafana monitoring stack

### Sem 8 — SOAR (Response & Blocking)

- [ ] Automated response playbooks (DDoS, Brute Force, Port Scan, C2, Web Attack)
- [ ] Firewall integration (iptables / pfSense API) for IP blocking
- [ ] Cowrie SSH honeypot integration
- [ ] Threat intelligence enrichment (AbuseIPDB, VirusTotal APIs)
- [ ] Analyst feedback loop → automated model retraining pipeline
- [ ] MITRE ATT&CK framework mapping
- [ ] Threat hunting dashboard with IOC search
- [ ] Adaptive ML with false positive feedback

---

## 16. References

1. Sharafaldin, I., Lashkari, A. H., & Ghorbani, A. A. (2018). *Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization*. ICISSP. — [CICIDS2017 Paper]
2. Canadian Institute for Cybersecurity. CICIDS2017 Dataset. https://www.unb.ca/cic/datasets/ids-2017.html
3. MITRE ATT&CK Framework. https://attack.mitre.org
4. FastAPI Documentation. https://fastapi.tiangolo.com
5. Scikit-learn: Machine Learning in Python. https://scikit-learn.org
6. SMOTE: Chawla, N. V. et al. (2002). *SMOTE: Synthetic Minority Over-sampling Technique*. JAIR.

---

<div align="center">

**IntrusionIQ** · Built by Hriday · B.Tech CSE Sem 6 Mini Project · 2026

*From a proof-of-concept to a production-grade SOC platform — one semester at a time.*

</div>