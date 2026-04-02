from pydantic import BaseModel, Field
from typing import Optional


class PredictionResponse(BaseModel):
    """Response for a single network flow prediction."""
    prediction: str = Field(description="BENIGN or ATTACK")
    confidence: float = Field(ge=0.0, le=1.0, description="Binary classification confidence")
    attack_type: Optional[str] = Field(
        default=None,
        description="Specific attack type from multi-class classifier (e.g., DDoS, PortScan). None if BENIGN."
    )
    attack_type_confidence: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="Confidence of the multi-class attack type prediction. None if BENIGN."
    )
    model: str = Field(default="two_stage_pipeline")


class BulkPredictionResponse(BaseModel):
    """Response when predicting on a full CSV file."""
    total_flows: int
    attack_count: int
    benign_count: int
    attack_percentage: float
    attack_type_counts: dict[str, int] = Field(
        default_factory=dict,
        description="Breakdown of attack counts by specific type (e.g., {'DDoS': 150, 'PortScan': 42})"
    )
    predictions: list[PredictionResponse]