import structlog
from fastapi import APIRouter
from app.schemas.metrics import MetricsResponse

logger = structlog.get_logger()

router = APIRouter()

# These are the actual results from your Kaggle training
# Voting Ensemble — test set: 504,160 samples
MODEL_METRICS = {
    "model_name": "Voting Ensemble (RF + XGBoost + MLP)",
    "accuracy": 99.90,
    "precision": 99.51,
    "recall": 99.93,
    "f1_score": 99.72,
    "roc_auc": 100.00,
    "false_positive_rate": 0.10,
    "training_dataset": "CICIDS2017"
}


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Model Metrics",
    description="Returns the performance metrics of the production model evaluated on the CICIDS2017 test set."
)
async def get_metrics():
    logger.info("Metrics requested")
    return MetricsResponse(**MODEL_METRICS)