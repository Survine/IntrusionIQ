from pydantic import BaseModel


class MetricsResponse(BaseModel):
    """Response for the model metrics endpoint."""
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    false_positive_rate: float
    training_dataset: str