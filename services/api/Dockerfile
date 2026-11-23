# SelfHire.ai FastAPI Backend & Worker Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY services/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application packages and services
COPY packages/ ./packages/
COPY services/ ./services/
COPY adapters/ ./adapters/
COPY data/ ./data/
COPY scripts/ ./scripts/

# Ensure PYTHONPATH sees root
ENV PYTHONPATH=/app
ENV PORT=8000

EXPOSE 8000

# Default entrypoint starts FastAPI with healthcheck
CMD ["python", "-m", "uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
