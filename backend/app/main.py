import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.ml_loader import load_models
from app.api.v1.routes import health, metrics, predict

logger = structlog.get_logger()


# ── Lifespan ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once at startup and once at shutdown.
    Load models on startup so they are ready before
    the first request hits the server.
    """
    logger.info("Starting IntrusionIQ API...")
    load_models()
    logger.info("API is ready to serve requests.")

    yield  # server is running and handling requests here

    logger.info("Shutting down IntrusionIQ API...")


# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered SOC Platform — Network Intrusion Detection API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# ── CORS ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ─────────────────────────────────────────────────────
app.include_router(
    health.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Health"]
)

app.include_router(
    metrics.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Metrics"]
)

app.include_router(
    predict.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Predictions"]
)