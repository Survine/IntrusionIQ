from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "IntrusionIQ"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Binary model paths (Stage 1 — voting ensemble)
    RF_MODEL_PATH: str = "models/rf_model.pkl"
    XGB_MODEL_PATH: str = "models/xgb_model.pkl"
    MLP_MODEL_PATH: str = "models/mlp_model.keras"
    ISO_MODEL_PATH: str = "models/iso_model.pkl"

    # Multi-class model path (Stage 2 — attack classification)
    MULTICLASS_MODEL_PATH: str = "models/multiclass_xgb.pkl"

    # Artifacts
    SCALER_PATH: str = "artifacts/scaler.pkl"
    FEATURES_PATH: str = "artifacts/feature_names.json"
    LABEL_MAPPING_PATH: str = "artifacts/label_mapping.json"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # TensorFlow
    TF_ENABLE_ONEDNN_OPTS: int = 0

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()