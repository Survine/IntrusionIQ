from pydantic import BaseModel
from typing import Literal


class HealthResponse(BaseModel):
    """Response for the health check endpoint."""
    status: Literal["healthy", "unhealthy"]
    app_name: str
    version: str
    model_loaded: bool