import io
import structlog
import numpy as np
import pandas as pd
from collections import Counter
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.ml_loader import get_models, predict_two_stage
from app.schemas.prediction import PredictionResponse, BulkPredictionResponse

logger = structlog.get_logger()

router = APIRouter()


@router.post(
    "/predict",
    response_model=BulkPredictionResponse,
    summary="Predict Network Intrusions",
    description=(
        "Upload a CSV file of network flows. Returns binary classification "
        "(BENIGN/ATTACK) plus specific attack type for each detected attack "
        "using a two-stage pipeline: binary ensemble → multi-class XGBoost."
    )
)
async def predict(file: UploadFile = File(...)):

    # ── 1. Validate file type ──────────────────────────────────
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are accepted."
        )

    # ── 2. Read CSV into DataFrame ─────────────────────────────
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        df.columns = df.columns.str.strip()
    except Exception as e:
        logger.error("Failed to read CSV", error=str(e))
        raise HTTPException(
            status_code=400,
            detail=f"Could not read CSV file: {str(e)}"
        )

    logger.info("CSV received", rows=len(df), columns=len(df.columns))

    # ── 3. Load models ─────────────────────────────────────────
    models = get_models()

    if models.rf_model is None or models.multiclass_model is None:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Server is not ready."
        )

    # ── 4. Validate required columns exist ────────────────────
    missing_cols = [
        col for col in models.feature_names
        if col not in df.columns
    ]

    if missing_cols:
        logger.error("Missing required columns", missing=missing_cols)
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing {len(missing_cols)} required columns: {missing_cols[:5]}"
        )

    # ── 5. Prepare features ────────────────────────────────────
    try:
        X = df[models.feature_names].copy()
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        X_scaled = models.scaler.transform(X)
    except Exception as e:
        logger.error("Feature preparation failed", error=str(e))
        raise HTTPException(
            status_code=422,
            detail=f"Feature preparation failed: {str(e)}"
        )

    # ── 6. Two-stage prediction ────────────────────────────────
    try:
        two_stage_results = predict_two_stage(X_scaled)
    except Exception as e:
        logger.error("Prediction failed", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

    # ── 7. Build response ──────────────────────────────────────
    predictions = []
    for r in two_stage_results:
        predictions.append(
            PredictionResponse(
                prediction=r["prediction"],
                confidence=r["confidence"],
                attack_type=r["attack_type"],
                attack_type_confidence=r["attack_type_confidence"],
                model="two_stage_pipeline"
            )
        )

    attack_count = sum(1 for p in predictions if p.prediction == "ATTACK")
    benign_count = len(predictions) - attack_count

    # Count attack types
    attack_type_counts = dict(Counter(
        p.attack_type for p in predictions
        if p.attack_type is not None
    ))

    logger.info(
        "Prediction complete",
        total=len(predictions),
        attacks=attack_count,
        benign=benign_count,
        attack_types=attack_type_counts
    )

    return BulkPredictionResponse(
        total_flows=len(predictions),
        attack_count=attack_count,
        benign_count=benign_count,
        attack_percentage=round((attack_count / len(predictions)) * 100, 2) if predictions else 0.0,
        attack_type_counts=attack_type_counts,
        predictions=predictions
    )