# ── Stage: Base Python image ──────────────────────────────────
# slim = stripped OS, no docs, no tests (~130MB vs ~900MB full)
# 3.11 specifically — TF wheels are compiled for 3.11
# Alpine rejected: musl libc breaks TensorFlow pre-built wheels
FROM python:3.11-slim

# ── Working directory ─────────────────────────────────────────
# All subsequent commands run from /app
# Created automatically if it doesn't exist
WORKDIR /app

# ── Dependency layer (cache optimization) ────────────────────
# ONLY requirements.txt copied first — not your code
# Docker caches this layer until requirements.txt changes
# Result: pip install (TF = 500MB) only reruns when deps change
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# --no-cache-dir: don't store pip's download cache in the image
# saves ~200MB for free — you'll never reuse that cache

# ── Application code ──────────────────────────────────────────
# .dockerignore excludes: .venv, __pycache__, .env, models/
# models/ and artifacts/ are injected via volume mount at runtime
COPY app/ ./app/

# ── Security: non-root user ───────────────────────────────────
# Root inside container = attacker can overwrite model files,
# read secrets, attempt container escape via kernel exploits
# appuser has no special permissions — blast radius minimized
RUN useradd --create-home appuser
USER appuser

# ── Documentation ─────────────────────────────────────────────
# Tells Docker "this container listens here"
# Does NOT open the port — docker-compose handles that
EXPOSE 8000

# ── Start command ─────────────────────────────────────────────
# Array syntax: signals go directly to uvicorn, not a shell wrapper
# 0.0.0.0: accept connections from Docker's network (not just localhost)
# --reload is GONE: no developer editing files inside containers
# --workers 2: two processes handle requests concurrently
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2"]