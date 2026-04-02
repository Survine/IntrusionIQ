import structlog
from fastapi import APIRouter
from app.core.config import settings
from app.core.ml_loader import get_models
from app.schemas.health import HealthResponse

logger = structlog.get_logger()

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Returns the current health status of the API and whether the model is loaded."
)
async def health_check():
    models = get_models()
    binary_loaded = models.rf_model is not None
    multiclass_loaded = models.multiclass_model is not None
    all_loaded = binary_loaded and multiclass_loaded

    logger.info(
        "Health check requested",
        binary_loaded=binary_loaded,
        multiclass_loaded=multiclass_loaded
    )

    return HealthResponse(
        status="healthy" if all_loaded else "unhealthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        model_loaded=all_loaded
    )