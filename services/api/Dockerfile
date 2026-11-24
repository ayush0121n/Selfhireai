# SelfHire.ai FastAPI Backend & Worker Dockerfile
FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Ensure PYTHONPATH sees /app
ENV PYTHONPATH=/app
ENV PORT=8000

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application packages and services
COPY packages/ ./packages/
COPY services/ ./services/
COPY adapters/ ./adapters/
COPY data/ ./data/
COPY scripts/ ./scripts/
COPY tests/fixtures/ ./tests/fixtures/

# Ensure data directories exist
RUN mkdir -p data/uploads/resumes data/receipts

EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/v1/health || exit 1

# Default entrypoint starts FastAPI with healthcheck
CMD ["python", "-m", "uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
