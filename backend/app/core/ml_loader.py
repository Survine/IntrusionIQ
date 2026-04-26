import os
import json
import joblib
import structlog
import numpy as np

os.environ["KERAS_BACKEND"] = "tensorflow"  # must be set before keras imports

import keras

from app.core.config import settings

logger = structlog.get_logger()


class MLModels:
    # Stage 1 — Binary voting ensemble
    rf_model = None
    xgb_model = None
    mlp_model = None
    iso_model = None

    # Stage 2 — Multi-class attack classifier
    multiclass_model = None

    # Shared artifacts
    scaler = None
    feature_names = None
    label_mapping = None  # {0: "BENIGN", 1: "Bot", 2: "DDoS", ...}


ml_models = MLModels()


def load_models():
    """
    Load all models and artifacts at startup.
    Stage 1: RF, XGBoost, MLP (binary voting ensemble) + Isolation Forest
    Stage 2: XGBoost multi-class (15-class attack classifier)
    """
    try:
        # ── Stage 1: Binary models ─────────────────────────────
        logger.info("Loading Random Forest...", path=settings.RF_MODEL_PATH)
        ml_models.rf_model = joblib.load(settings.RF_MODEL_PATH)

        logger.info("Loading XGBoost...", path=settings.XGB_MODEL_PATH)
        ml_models.xgb_model = joblib.load(settings.XGB_MODEL_PATH)

        logger.info("Loading MLP...", path=settings.MLP_MODEL_PATH)
        ml_models.mlp_model = keras.models.load_model(settings.MLP_MODEL_PATH)

        logger.info("Loading Isolation Forest...", path=settings.ISO_MODEL_PATH)
        ml_models.iso_model = joblib.load(settings.ISO_MODEL_PATH)

        # ── Stage 2: Multi-class model ─────────────────────────
        logger.info("Loading multi-class XGBoost...", path=settings.MULTICLASS_MODEL_PATH)
        ml_models.multiclass_model = joblib.load(settings.MULTICLASS_MODEL_PATH)

        # ── Shared artifacts ───────────────────────────────────
        logger.info("Loading scaler...", path=settings.SCALER_PATH)
        ml_models.scaler = joblib.load(settings.SCALER_PATH)

        logger.info("Loading feature names...", path=settings.FEATURES_PATH)
        with open(settings.FEATURES_PATH, "r") as f:
            ml_models.feature_names = json.load(f)

        logger.info("Loading label mapping...", path=settings.LABEL_MAPPING_PATH)
        with open(settings.LABEL_MAPPING_PATH, "r") as f:
            raw = json.load(f)
            ml_models.label_mapping = {int(k): v for k, v in raw.items()}

        logger.info(
            "All models loaded successfully",
            features=len(ml_models.feature_names),
            num_classes=len(ml_models.label_mapping),
            classes=list(ml_models.label_mapping.values())
        )

    except Exception as e:
        logger.error("Failed to load models", error=str(e))
        raise


def predict_binary_ensemble(X_scaled: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Stage 1: Binary voting ensemble.
    Averages probabilities from RF, XGBoost, and MLP.
    Returns (binary_predictions, attack_probabilities).
    """
    rf_proba = ml_models.rf_model.predict_proba(X_scaled)[:, 1]
    xgb_proba = ml_models.xgb_model.predict_proba(X_scaled)[:, 1]

    mlp_raw = ml_models.mlp_model.predict(X_scaled, verbose=0)
    mlp_proba = mlp_raw[:, 0] if mlp_raw.shape[1] == 1 else mlp_raw[:, 1]

    avg_proba = (rf_proba + xgb_proba + mlp_proba) / 3.0
    predictions = (avg_proba >= 0.50).astype(int)

    return predictions, avg_proba


def predict_parallel_ensemble(X_scaled: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Stage 1 Parallel OR Ensembler:
    Combines Voting Ensemble (high recall) with Isolation Forest (zero-day detection).
    Flags as ATTACK if either model detects an anomaly.
    """
    binary_preds, binary_proba = predict_binary_ensemble(X_scaled)

    # Isolation Forest: 1 = normal, -1 = anomaly
    iso_preds = ml_models.iso_model.predict(X_scaled)

    # OR logic: ATTACK if ensemble says 1 OR iso says -1
    final_preds = np.where((binary_preds == 1) | (iso_preds == -1), 1, 0)

    # For flows caught ONLY by ISO (ensemble said BENIGN), assign 0.90 nominal confidence
    # This signals "zero-day suspicion" without fabricating a high ensemble score
    final_proba = np.where(
        (binary_preds == 0) & (iso_preds == -1),
        0.90,
        binary_proba
    )

    return final_preds, final_proba


def predict_two_stage(X_scaled: np.ndarray) -> list[dict]:
    """
    Two-stage prediction pipeline:
      Stage 1: Parallel OR Ensembler → BENIGN or ATTACK
      Stage 2: For ATTACKs, multiclass XGBoost → specific attack type

    BENIGN override rules:
      - Stage 2 says BENIGN with >= 0.90 confidence → override to BENIGN, report Stage 2 confidence
      - Stage 2 says BENIGN with <  0.90 confidence → keep as ATTACK, label "Needs Review"
      - Stage 2 says attack class → keep label as-is, no action needed

    Returns a list of dicts, one per row.
    """
    # Stage 1
    binary_preds, binary_proba = predict_parallel_ensemble(X_scaled)

    # Identify attack indices for Stage 2
    attack_indices = np.where(binary_preds == 1)[0]

    # Pre-allocate Stage 2 outputs
    attack_types = [None] * len(binary_preds)
    attack_type_confidences = [None] * len(binary_preds)

    if len(attack_indices) > 0:
        X_attacks = X_scaled[attack_indices]
        mc_proba = ml_models.multiclass_model.predict_proba(X_attacks)
        mc_preds = np.argmax(mc_proba, axis=1)
        mc_confs = np.max(mc_proba, axis=1)

        for i, idx in enumerate(attack_indices):
            pred_class = int(mc_preds[i])
            attack_types[idx] = ml_models.label_mapping.get(pred_class, f"Unknown-{pred_class}")
            attack_type_confidences[idx] = float(mc_confs[i])

            if attack_types[idx] == "BENIGN" and mc_confs[i] >= 0.90:
                # Stage 2 is confident this is genuinely BENIGN — safe to override
                # Store mc_confs[i] directly into binary_proba so results builder
                # reports Stage 2's confidence, not Stage 1's
                binary_preds[idx] = 0
                binary_proba[idx] = mc_confs[i]
                attack_types[idx] = None
                attack_type_confidences[idx] = None

            elif attack_types[idx] == "BENIGN" and mc_confs[i] < 0.90:
                # Stage 2 uncertain — keep as ATTACK, flag for analyst review
                attack_types[idx] = "Needs Review"
                # attack_type_confidences[idx] left as-is — analyst can see Stage 2's score

            # else: Stage 2 assigned a confident attack class — label already set, nothing to do

    # Build final results list
    results = []
    for i in range(len(binary_preds)):
        pred = int(binary_preds[i])
        label = "ATTACK" if pred == 1 else "BENIGN"

        # For BENIGN: binary_proba already holds the correct value —
        # either the original ensemble score OR mc_confs (if overridden)
        # So we always report binary_proba[i] directly as the BENIGN confidence
        confidence = float(binary_proba[i]) if pred == 1 else float(binary_proba[i])

        results.append({
            "prediction": label,
            "confidence": round(confidence, 4),
            "attack_type": attack_types[i],
            "attack_type_confidence": round(attack_type_confidences[i], 4) if attack_type_confidences[i] is not None else None,
        })

    return results


def get_models() -> MLModels:
    """
    Returns the loaded models object.
    Used as a FastAPI dependency in routes.
    """
    return ml_models