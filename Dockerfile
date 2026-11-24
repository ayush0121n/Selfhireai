# SelfHire.ai FastAPI Backend Dockerfile
FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONPATH=/app
ENV PORT=8000

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application codebase
COPY packages/ ./packages/
COPY services/ ./services/
COPY adapters/ ./adapters/
COPY data/ ./data/
COPY scripts/ ./scripts/
COPY tests/fixtures/ ./tests/fixtures/

# Ensure data directories exist
RUN mkdir -p data/uploads/resumes data/receipts

# Expose FastAPI port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/api/v1/health || exit 1

# Start Uvicorn
CMD ["python", "-m", "uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
