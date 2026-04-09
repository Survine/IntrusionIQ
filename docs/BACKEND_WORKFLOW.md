# IntrusionIQ Backend Workflow

This document explains the end-to-end data lifecycle of the `IntrusionIQ` backend, from the moment a user uploads a CSV of network traffic to the final prediction response.

## 1. Request Handling & Validation (`predict.py`)
- The user accesses the `/api/v1/predict` endpoint, providing a `.csv` file containing network flows.
- The FastAPI router reads the file into a Pandas DataFrame and checks if the CSV contains all **66 required features** based on the exported `feature_names.json`.
- Missing values are imputed with median values, and infinities (`np.inf`) are converted to `NaN` then imputed.

## 2. Preprocessing & Scaling
- The backend loads the pre-fitted Scikit-Learn standard scaler from `artifacts/scaler.pkl`.
- The raw network flow data is normalized (`X_scaled`) so the values fall inside ranges optimally ingested by our algorithms.

## 3. Stage 1: The Parallel "OR" Ensembler (`ml_loader.py`)
To maximize both *raw accuracy* on known attacks and *zero-day detection* on novel attacks, the pipeline evaluates the normalized flows through two parallel systems:

1. **The Voting Ensemble (High Recall on Known Attacks)**
   - The flow is evaluated by a Random Forest, an XGBoost classifier, and an MLP Neural Network.
   - Their three probability scores are averaged. If `avg >= 0.50`, it votes **ATTACK**.
2. **The Isolation Forest (Zero-Day Resiliency)**
   - Since it evaluates anomalies without needing to map exact supervised patterns, it can catch zero-day exploits.
   - If the flow is deemed anomalous, it votes **ATTACK**.

> [!IMPORTANT]
> **Decision Logic:** If *either* the Voting Ensemble or the Isolation Forest flags the flow as an ATTACK, the flow is marked as an ATTACK. If both models mark it normal, the flow is instantly finalized as **BENIGN** and bypasses stage 2 entirely to save compute.

## 4. Stage 2: Attack Classification
- All flows classified as **ATTACK** in Stage 1 are gathered into a subset.
- This subset is forwarded to the heavy **Multi-Class XGBoost Classifier**.
- The Multi-Class model assigns a specific label to the flow (e.g., `DDoS`, `Bot`, `Heartbleed`, `PortScan`) using the `label_mapping.json`.
- *Fallback Edge Case:* If the Multi-Class model surprisingly determines the threat is actually `BENIGN`, it overrides the Stage 1 decision.

## 5. Response Aggregation
- The backend reconstructs the data back into its original order.
- It builds a structured JSON payload (`BulkPredictionResponse`) containing:
  - Total flows, attack count, and benign count.
  - Overall attack percentage.
  - A frequency dictionary breaking down the specific attack types caught.
  - A granular list itemizing the prediction for every single row submitted in the CSV.
- The results are returned instantly to the requesting client.
