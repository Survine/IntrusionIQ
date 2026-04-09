# Coding Conventions

## Code Style

### Python (Backend)
- **Standard PEP 8** naming conventions throughout
- Classes: `PascalCase` (`MLModels`, `Settings`, `PredictionResponse`)
- Functions/methods: `snake_case` (`load_models`, `predict_two_stage`, `get_models`)
- Constants: `UPPER_SNAKE_CASE` (`MODEL_METRICS`, `REQUIRED`)
- Module variables: `snake_case` (`ml_models`, `logger`, `settings`)

### Import Organization
Imports follow a consistent pattern across backend files:
```python
# 1. Standard library
import io
import json
from contextlib import asynccontextmanager

# 2. Third-party
import structlog
import numpy as np
import pandas as pd
from fastapi import FastAPI, APIRouter

# 3. Local application
from app.core.config import settings
from app.core.ml_loader import load_models
```

### JSX (Frontend)
- Frontend files exist as empty placeholders — no established patterns yet
- Component directories use PascalCase (`Dashboard/`, `MetricsPanel/`)

## Patterns

### Singleton Pattern
Used for global state that should be initialized once:
```python
# Config singleton (backend/app/core/config.py)
settings = Settings()

# Models singleton (backend/app/core/ml_loader.py)
ml_models = MLModels()
```

### Router Registration Pattern
Each route module creates a router, main.py includes all routers:
```python
# In route module (e.g., backend/app/api/v1/routes/health.py)
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check(): ...

# In main.py
app.include_router(health.router, prefix=settings.API_V1_PREFIX, tags=["Health"])
```

### Pydantic Schema Pattern
Response models use Field descriptors with documentation:
```python
class PredictionResponse(BaseModel):
    prediction: str = Field(description="BENIGN or ATTACK")
    confidence: float = Field(ge=0.0, le=1.0, description="Binary classification confidence")
    attack_type: Optional[str] = Field(default=None, description="Specific attack type...")
```

### Model Access Pattern
Models are loaded at startup and accessed via getter function:
```python
# Load at startup
load_models()

# Access in routes
models = get_models()
if models.rf_model is None:
    raise HTTPException(status_code=503, detail="Models not loaded.")
```

## Error Handling

### HTTP Exception Pattern
Backend uses FastAPI's `HTTPException` at each validation stage:
```python
# 400 — Bad input
raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

# 422 — Validation failure
raise HTTPException(status_code=422, detail=f"CSV is missing {len(missing)} required columns")

# 500 — Internal error
raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# 503 — Service unavailable
raise HTTPException(status_code=503, detail="Models not loaded. Server is not ready.")
```

### Try/Except Pattern
Model loading and prediction wrap in try/except with structured logging:
```python
try:
    ml_models.rf_model = joblib.load(settings.RF_MODEL_PATH)
except Exception as e:
    logger.error("Failed to load models", error=str(e))
    raise
```

### No Global Exception Handler
- There is no middleware-level exception handler
- Each route handles its own errors individually
- Unhandled exceptions result in default FastAPI 500 responses

## Logging

### Structured Logging
```python
import structlog
logger = structlog.get_logger()

# Usage with key-value context
logger.info("CSV received", rows=len(df), columns=len(df.columns))
logger.error("Failed to read CSV", error=str(e))
logger.info("Prediction complete", total=len(predictions), attacks=attack_count)
```

## Documentation

### Docstrings
- Functions use triple-quoted docstrings describing purpose and behavior
- Located in `backend/app/core/ml_loader.py` — most documented module
- Route functions have summary/description via FastAPI decorators instead

### API Documentation
- FastAPI auto-generates OpenAPI spec
- Swagger UI at `/docs`
- ReDoc at `/redoc`
- Each route has `summary` and `description` parameters

### Section Comments
Code uses decorative section headers for visual organization:
```python
# ── Lifespan ───────────────────────────────────────────────────
# ── CORS ───────────────────────────────────────────────────────
# ── Routes ─────────────────────────────────────────────────────
```

## Type Annotations
- **Consistent use of Python type hints** across the backend
- Pydantic models provide runtime validation
- Function return types annotated: `-> tuple[np.ndarray, np.ndarray]`, `-> list[dict]`
- `Literal["healthy", "unhealthy"]` used for constrained string types
